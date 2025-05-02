const Order = require("../models/Order");
const axios = require("axios");
const { publishMessage } = require("../services/rabbitMQService");

async function placeOrder(req, res) {
    try {
        console.log("➡️ Received request to place order");

        const userId = req.user?.id;
        if (!userId) {
            console.error("❌ Missing user ID from JWT");
            return res.status(401).json({ success: false, message: "Unauthorized: Missing user ID" });
        }

        console.log(`🛒 Fetching cart for user: ${userId}`);

        // 🛒 Fetch user's cart
        let cartResponse;
        try {
            const cartUrl = `${process.env.CART_SERVICE_URL}/api/cart/`;
            console.log(`📤 Fetching cart from: ${cartUrl}`);

            cartResponse = await axios.get(cartUrl, {
                headers: { Authorization: req.headers.authorization }
            });

            if (!cartResponse.data || !Array.isArray(cartResponse.data.items)) {
                console.error("❌ Cart data is invalid:", cartResponse.data);
                return res.status(400).json({ success: false, message: "Cart is empty or invalid format" });
            }
        } catch (err) {
            console.error("❌ Failed to fetch cart items:", err.response?.data || err.message);
            return res.status(500).json({ success: false, message: "Cart Service is unavailable" });
        }

        const cartItems = cartResponse.data.items;
        if (cartItems.length === 0) {
            return res.status(400).json({ success: false, message: "Cart is empty" });
        }

        let totalAmount = 0;
        const orderedItems = [];

        console.log("🔄 Processing cart items...");

        for (const item of cartItems) {
            const itemTotal = parseFloat((item.price * item.quantity).toFixed(2));
            totalAmount = parseFloat((totalAmount + itemTotal).toFixed(2));

            orderedItems.push({
                productId: item.productId,
                quantity: item.quantity,
                price: item.price,
                productName: item.name,
                productImage: item.image
            });
        }

        console.log("✅ Order total:", totalAmount);

        // 📝 Create new order
        const newOrder = new Order({
            userId,
            items: orderedItems,
            totalAmount,
            status: "Pending"
        });
        await newOrder.save();
        console.log("📝 Order created:", newOrder._id);

        // 💳 Payment
        try {
            const paymentResponse = await axios.post(`${process.env.PAYMENT_SERVICE_URL}/api/payment`, {
                userId,
                amount: totalAmount,
                orderId: newOrder._id,
            });

            if (paymentResponse.data.status !== "success") {
                console.error("❌ Payment failed:", paymentResponse.data);
                return res.status(400).json({ success: false, message: "Payment Failed" });
            }

            console.log("💳 Payment successful");
        } catch (paymentError) {
            console.error("❌ Payment service error:", paymentError.response?.data || paymentError.message);
            return res.status(400).json({ success: false, message: "Payment Failed" });
        }

        // 📉 Deduct stock
        console.log("📉 Deducting stock...");
        for (const item of orderedItems) {
            try {
                await axios.put(`${process.env.PRODUCT_SERVICE_URL}/api/products/deduct-stock`, {
                    productId: item.productId,
                    quantity: item.quantity,
                });
                console.log(`✅ Stock updated for ${item.productId}`);
            } catch (err) {
                console.error(`❌ Failed to update stock for ${item.productId}:`, err.message);
            }
        }

        // 🧹 Clear the cart using DELETE /clear
        try {
            const clearCartResponse = await axios.delete(`${process.env.CART_SERVICE_URL}/api/cart/clear`, {
                headers: { Authorization: req.headers.authorization }
            });

            if (clearCartResponse.data.success) {
                console.log("🧹 Cart cleared successfully");
            } else {
                console.error("❌ Failed to clear cart:", clearCartResponse.data.message);
            }
        } catch (err) {
            console.error("❌ Failed to clear cart:", err.response?.data || err.message);
        }

        // ✅ Finalize the order
        newOrder.status = "Paid";
        await newOrder.save();

        // 📢 Publish message to RabbitMQ
        const message = {
            orderId: newOrder._id,
            userId,
            items: orderedItems
        };

        await publishMessage("order_queue", message);
        console.log("📢 Published order to queue");

        return res.status(201).json({ success: true, message: "Order placed successfully", order: newOrder });

    } catch (error) {
        console.error("❌ Unexpected error in placeOrder:", error.message);
        return res.status(500).json({ success: false, message: "Internal Server Error" });
    }
}


async function getOrders(req, res) {
    try {
        const userId = req.user.id;
        const orders = await Order.find({ userId });
        if (!orders.length) {
            return res.status(404).json({ success: false, message: "No orders found" });
        }
        res.status(200).json({ success: true, orders });
    } catch (err) {
        console.error("❌ Error fetching orders:", err.message);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
}


async function placeSingleProductOrder(req, res) {
    try {
        const userId = req.user.id;
        const { productId, quantity } = req.body;

        if (!productId || !quantity) {
            return res.status(400).json({ success: false, message: "Product ID and quantity required" });
        }

        // 🛍 Fetch product details
        const productResponse = await axios.get(`${process.env.PRODUCT_SERVICE_URL}/api/products/${productId}`);
        const product = productResponse.data.product || productResponse.data;

        console.log("🔍 Product fetched:", product);

        if (!product || !product.image_url || !product.name || !product.price) {
            return res.status(400).json({ success: false, message: "Invalid product data received" });
        }

        const totalAmount = parseFloat((product.price * quantity).toFixed(2));
        const orderedItems = [{
            productId,
            quantity,
            price: product.price,
            productName: product.name,
            productImage: product.image_url // ✅ Match schema field
        }];

        // 📝 Create order
        const newOrder = new Order({
            userId,
            items: orderedItems,
            totalAmount,
            status: "Pending"
        });

        await newOrder.save();
        console.log("📝 Order created:", newOrder._id);

        // 💳 Payment
        const paymentResponse = await axios.post(`${process.env.PAYMENT_SERVICE_URL}/api/payment`, {
            userId,
            amount: totalAmount,
            orderId: newOrder._id
        });

        if (paymentResponse.data.status !== "success") {
            return res.status(400).json({ success: false, message: "Payment failed" });
        }

        console.log("💳 Payment successful");

        // 📉 Deduct stock
        await axios.put(`${process.env.PRODUCT_SERVICE_URL}/api/products/deduct-stock`, {
            productId,
            quantity
        });

        console.log("📉 Stock deducted");

        // 🧹 Remove item from cart
        try {
            // Log the request for debugging
            console.log("📤 Sending request to remove item from cart:", {
                productId,
                headers: { Authorization: req.headers.authorization }
            });

            // Send request to Cart Service to remove the item by passing the productId in the URL
            const cartResponse = await axios.delete(`${process.env.CART_SERVICE_URL}/api/cart/remove/${productId}`, {
                headers: { Authorization: req.headers.authorization }
            });

            // Check response for success
            if (cartResponse.data.success) {
                console.log("🧹 Single product removed from cart");
            } else {
                console.error("❌ Failed to remove product from cart:", cartResponse.data.message);
            }
        } catch (err) {
            console.error("❌ Failed to remove product from cart:", err.response?.data || err.message);
        }

        // ✅ Finalize order
        newOrder.status = "Paid";
        await newOrder.save();

        // 📢 Publish to queue
        await publishMessage("order_queue", {
            orderId: newOrder._id,
            userId,
            items: orderedItems
        });

        console.log("📢 Published order to queue");

        return res.status(201).json({ success: true, message: "Order placed", order: newOrder });

    } catch (err) {
        console.error("❌ Error in placeSingleProductOrder:", err.message);
        return res.status(500).json({ success: false, message: "Internal Server Error" });
    }
}



module.exports = {
    placeOrder,
    getOrders,
    placeSingleProductOrder
};
