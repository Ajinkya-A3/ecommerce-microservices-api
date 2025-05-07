const Checkout = require("../models/Checkout");
const axios = require("axios");

const placeOrder = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

        const { shippingAddress } = req.body;

        const cartRes = await axios.get(process.env.CART_SERVICE_URL, {
            headers: { Authorization: req.headers.authorization }
        });

        const cartItems = cartRes.data.items || [];

        if (cartItems.length === 0) {
            return res.status(400).json({ success: false, message: "Cart is empty" });
        }

        const items = cartItems.map(item => ({
            productId: item.productId,
            productName: item.name,
            productImage: item.image,
            quantity: item.quantity,
            price: item.price
        }));

        const totalAmount = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

        const checkout = new Checkout({
            userId,
            items,
            totalAmount,
            shippingAddress,
            paymentStatus: "Pending"
        });

        await checkout.save();

        const paymentRes = await axios.post(process.env.PAYMENT_SERVICE_URL, {
            userId,
            amount: totalAmount,
            orderId: checkout._id
        });

        if (paymentRes.data.status === "success") {
            checkout.paymentStatus = "Paid";
            await checkout.save();
        } else {
            checkout.paymentStatus = "Failed";
            await checkout.save();
            return res.status(400).json({ success: false, message: "Payment Failed" });
        }

        await axios.put(`${process.env.PRODUCT_SERVICE_URL}/deduct-stock`, {
            items: items.map(item => ({ productId: item.productId, quantity: item.quantity }))
        });

        await axios.delete(`${process.env.CART_SERVICE_URL}/clear`, {
            headers: { Authorization: req.headers.authorization }
        });

        return res.status(201).json({ success: true, message: "Checkout complete", order: checkout });
    } catch (err) {
        console.error("❌ Error during checkout:", err.message);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};

const getOrders = async (req, res) => {
    try {
        const orders = await Checkout.find({ userId: req.user.id });
        res.status(200).json({ success: true, orders });
    } catch (err) {
        res.status(500).json({ success: false, message: "Failed to get orders" });
    }
};


async function placeSingleProductOrder(req, res) {
    try {
        const userId = req.user.id;
        const { productId, quantity, shippingAddress } = req.body;

        if (!productId || !quantity || !shippingAddress) {
            return res.status(400).json({
                success: false,
                message: "Product ID, quantity, and shipping address are required",
            });
        }

        // 🛍 Fetch product details
        const productResponse = await axios.get(`${process.env.PRODUCT_SERVICE_URL}/${productId}`);
        const product = productResponse.data.product || productResponse.data;

        if (!product || !product.price || !product.name || !product.image_url) {
            return res.status(400).json({
                success: false,
                message: "Invalid product data received",
            });
        }

        const totalAmount = parseFloat((product.price * quantity).toFixed(2));
        const orderedItems = [{
            productId,
            quantity,
            price: product.price,
            productName: product.name,
            productImage: product.image_url
        }];

        // 📝 Create initial checkout
        const newCheckout = new Checkout({
            userId,
            items: orderedItems,
            totalAmount,
            status: "Pending",
            shippingAddress,
            paymentStatus: "Unpaid"
        });

        await newCheckout.save();
        console.log("📝 Checkout created:", newCheckout._id);

        // 💳 Trigger payment
        const paymentResponse = await axios.post(`${process.env.PAYMENT_SERVICE_URL}`, {
            userId,
            amount: totalAmount,
            orderId: newCheckout._id
        });

        if (paymentResponse.data.status !== "success") {
            return res.status(400).json({
                success: false,
                message: "Payment failed"
            });
        }

        console.log("💳 Payment successful");

        // 📉 Deduct stock
        await axios.put(`${process.env.PRODUCT_SERVICE_URL}/deduct-stock`, {
            productId,
            quantity
        });

        console.log("📉 Stock deducted");

        // 🧹 Remove product from cart
        try {
            await axios.delete(`${process.env.CART_SERVICE_URL}/remove/${productId}`, {
                headers: { Authorization: req.headers.authorization }
            });
            console.log("🧹 Product removed from cart");
        } catch (err) {
            console.error("❌ Failed to remove from cart:", err.response?.data || err.message);
        }

        // ✅ Update status and save
        newCheckout.status = "Confirmed";
        newCheckout.paymentStatus = "Paid";
        await newCheckout.save();

        // 📢 Publish to message queue
        await publishMessage("order_queue", {
            orderId: newCheckout._id,
            userId,
            items: orderedItems
        });

        console.log("📢 Published order to queue");

        return res.status(201).json({
            success: true,
            message: "Single product order placed successfully",
            order: newCheckout
        });

    } catch (err) {
        console.error("❌ Error placing single product order:", err.message);
        return res.status(500).json({
            success: false,
            message: "Internal Server Error"
        });
    }
}


module.exports = { placeOrder, getOrders , placeSingleProductOrder };
