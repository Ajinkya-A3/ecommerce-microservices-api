const Order = require("../models/Order");
const axios = require("axios");
const { publishMessage } = require("../services/rabbitMQService");

async function placeOrder(req, res) {
    try {
        console.log("➡️ Received request to place order");

        const userId = req.user?.id; // Extract user ID from JWT token
        if (!userId) {
            console.error("❌ Missing user ID from JWT");
            return res.status(401).json({ success: false, message: "Unauthorized: Missing user ID" });
        }

        console.log(`🛒 Fetching cart for user: ${userId}`);

        let cartResponse;
        try {
            const cartUrl = `${process.env.CART_SERVICE_URL}/api/cart/`;
            console.log(`📤 Fetching cart from: ${cartUrl}`);

            cartResponse = await axios.get(cartUrl, {
                headers: { Authorization: req.headers.authorization }
            });

            if (!cartResponse.data || !cartResponse.data.cartItems) {
                throw new Error("Cart Service returned empty response");
            }
        } catch (err) {
            console.error("❌ Failed to fetch cart items:", err.response?.data || err.message);
            return res.status(500).json({ success: false, message: "Cart Service is unavailable" });
        }

        const cartItems = cartResponse.data.cartItems;
        if (cartItems.length === 0) {
            return res.status(400).json({ success: false, message: "Cart is empty" });
        }

        let totalAmount = 0;
        let orderedItems = [];

        console.log("🔄 Fetching product details & calculating total amount...");

        for (const cartItem of cartItems) {
            const productId = cartItem.productId;
            const quantity = cartItem.quantity;

            try {
                const productResponse = await axios.get(`${process.env.PRODUCT_SERVICE_URL}/api/products/${productId}`);
                const product = productResponse.data;

                if (!product) {
                    return res.status(400).json({ success: false, message: `Product ${productId} not found` });
                }

                const price = product.price;
                const itemTotalPrice = price * quantity;
                totalAmount = parseFloat((totalAmount + itemTotalPrice).toFixed(2)); // ✅ Fix floating-point issue

                orderedItems.push({ 
                    productId, 
                    quantity, 
                    price, 
                    productName: product.name,  // ✅ Store product name
                    productImage: product.image // ✅ Store product image URL
                });
            } catch (error) {
                console.error(`❌ Failed to fetch product ${productId}:`, error.message);
                return res.status(500).json({ success: false, message: `Product Service is unavailable` });
            }
        }

        console.log("🛒 Total Order Amount:", totalAmount);

        // ✅ Create new order with "Pending" status
        const newOrder = new Order({ userId, items: orderedItems, totalAmount, status: "Pending" });
        await newOrder.save();
        console.log("🛒 New Order Created:", newOrder);

        // ✅ Make Payment API Call
        try {
            const paymentResponse = await axios.post(`${process.env.PAYMENT_SERVICE_URL}/api/payment`, {
                userId,
                amount: totalAmount,
                orderId: newOrder._id,
            });

            if (paymentResponse.data.status !== "success") {
                console.error("❌ Payment Failed:", paymentResponse.data);
                return res.status(400).json({ success: false, message: "Payment Failed" });
            }

            console.log("💰 Payment Successful:", paymentResponse.data);
        } catch (paymentError) {
            console.error("❌ Payment Service Error:", paymentError.response?.data || paymentError.message);
            return res.status(400).json({ success: false, message: "Payment Failed" });
        }

        // ✅ Deduct stock for each ordered product
        console.log("📉 Deducting stock...");
        for (const item of orderedItems) {
            try {
                await axios.put(`${process.env.PRODUCT_SERVICE_URL}/api/products/deduct-stock`, {
                    productId: item.productId,
                    quantity: item.quantity,
                });
                console.log(`✅ Stock Deducted for Product ID: ${item.productId}`);
            } catch (stockError) {
                console.error(`❌ Stock Deduction Failed for Product ID: ${item.productId}:`, stockError.message);
            }
        }

        // ✅ Remove ordered items from the cart
        console.log("🛒 Removing ordered items from cart...");
        try {
            await axios.put(`${process.env.CART_SERVICE_URL}/api/cart/remove-items/`, {
                orderedItems: orderedItems.map(item => item.productId),
            }, {
                headers: { Authorization: req.headers.authorization }
            });

            console.log("✅ Ordered Items Removed from Cart");
        } catch (cartError) {
            console.error("❌ Failed to Remove Items from Cart:", cartError.response?.data || cartError.message);
        }

        // ✅ Update order status to "Paid"
        newOrder.status = "Paid";
        await newOrder.save();

        // ✅ Publish order details to RabbitMQ
        const message = { orderId: newOrder._id, userId, items: orderedItems };
        console.log("📢 Publishing Message to Queue:", message);
        await publishMessage("order_queue", message);

        return res.status(201).json({ success: true, message: "Order placed successfully", order: newOrder });

    } catch (error) {
        console.error("❌ Order Placement Error:", error.message);
        return res.status(500).json({ success: false, message: "Internal Server Error" });
    }
}


async function getOrders(req, res) {
    try {
        const userId = req.user.id; // Extract userId from JWT token

        // ✅ Fetch orders for the authenticated user
        const orders = await Order.find({ userId });

        if (!orders || orders.length === 0) {
            return res.status(404).json({ success: false, message: "No orders found" });
        }

        res.status(200).json({ success: true, orders });
    } catch (error) {
        console.error("❌ Error fetching orders:", error.message);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
}

module.exports = { placeOrder, getOrders };
