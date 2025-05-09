const Checkout = require("../models/checkoutModel");
const axios = require("axios");

const placeOrder = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            console.error("❌ User ID missing in token.");
            return res.status(401).json({ success: false, message: "Unauthorized" });
        }

        const { shippingAddress } = req.body;
        if (!shippingAddress) {
            console.error("❌ Shipping address not provided.");
            return res.status(400).json({ success: false, message: "Shipping address is required" });
        }

        // 🛒 Fetch cart items
        const cartRes = await axios.get(process.env.CART_SERVICE_URL, {
            headers: { Authorization: req.headers.authorization }
        });

        const cartItems = cartRes.data.items || [];
        if (cartItems.length === 0) {
            console.warn("⚠️ Cart is empty for user:", userId);
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

        // 📝 Create checkout with default shippingStatus = "Pending"
        const checkout = new Checkout({
            userId,
            items,
            totalAmount,
            shippingAddress,
            paymentStatus: "Pending",
            shippingStatus: "Pending" // explicitly set, even though default covers this
        });

        await checkout.save();
        console.log("✅ Checkout created:", checkout._id);

        // 💳 Payment request
        let paymentRes;
        try {
            paymentRes = await axios.post(process.env.PAYMENT_SERVICE_URL, {
                userId,
                amount: totalAmount,
                orderId: checkout._id
            });
        } catch (err) {
            console.error("❌ Payment service request failed:", err.response?.data || err.message);
            checkout.paymentStatus = "Failed";
            await checkout.save();
            return res.status(400).json({ success: false, message: "Payment request failed" });
        }

        if (paymentRes.data.status !== "success") {
            checkout.paymentStatus = "Failed";
            await checkout.save();
            console.error("❌ Payment failed from service:", paymentRes.data);
            return res.status(400).json({ success: false, message: "Payment failed" });
        }

        checkout.paymentStatus = "Paid";
        await checkout.save();
        console.log("💰 Payment successful");

        // 📦 Deduct stock for each item
        for (const item of items) {
            try {
                await axios.put(`${process.env.PRODUCT_SERVICE_URL}/deduct-stock`, {
                    productId: item.productId,
                    quantity: item.quantity
                });
                console.log(`📦 Stock deducted for ${item.productId}`);
            } catch (err) {
                console.error(`❌ Failed to deduct stock for ${item.productId}:`, err.response?.data || err.message);
            }
        }

        // 🧹 Clear cart
        try {
            await axios.delete(`${process.env.CART_SERVICE_URL}/clear`, {
                headers: { Authorization: req.headers.authorization }
            });
            console.log("🧹 Cart cleared");
        } catch (err) {
            console.error("❌ Failed to clear cart:", err.response?.data || err.message);
        }

        return res.status(201).json({ success: true, message: "Checkout complete", order: checkout });

    } catch (err) {
        console.error("❌ Unexpected error during checkout:", err.message);
        return res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};


const getOrders = async (req, res) => {
    try {
        const userId = req.user.id;
        const orders = await Checkout.find({ userId });
        return res.status(200).json({ success: true, orders });
    } catch (err) {
        console.error("❌ Error fetching orders:", err.message);
        return res.status(500).json({ success: false, message: "Failed to fetch orders" });
    }
};

const placeSingleProductOrder = async (req, res) => {
    try {
        const userId = req.user.id;
        const { productId, quantity, shippingAddress } = req.body;


        if (!productId || !quantity || !shippingAddress) {
            console.error("❌ Missing required fields: productId, quantity, or shippingAddress");
            return res.status(400).json({
                success: false,
                message: "Product ID, quantity, and shipping address are required"
            });
        }

        const productResponse = await axios.get(`${process.env.PRODUCT_SERVICE_URL}/${productId}`);
        const product = productResponse.data.product || productResponse.data;

        if (!product || !product.name || !product.price || !product.image_url) {
            console.error("❌ Invalid product data:", product);
            return res.status(400).json({ success: false, message: "Invalid product data received" });
        }

        const totalAmount = parseFloat((product.price * quantity).toFixed(2));
        const items = [{
            productId,
            quantity,
            price: product.price,
            productName: product.name,
            productImage: product.image_url
        }];

        const checkout = new Checkout({
            userId,
            items,
            totalAmount,
            shippingAddress,
            paymentStatus: "Pending"
        });

        await checkout.save();
        console.log("✅ Single product checkout created:", checkout._id);

        // Payment
        let paymentRes;
        try {
            paymentRes = await axios.post(process.env.PAYMENT_SERVICE_URL, {
                userId,
                amount: totalAmount,
                orderId: checkout._id
            });
        } catch (err) {
            console.error("❌ Payment error:", err.response?.data || err.message);
            return res.status(400).json({ success: false, message: "Payment service error" });
        }

        if (paymentRes.data.status !== "success") {
            console.error("❌ Payment failed:", paymentRes.data);
            return res.status(400).json({ success: false, message: "Payment failed" });
        }

        checkout.paymentStatus = "Paid";
        checkout.status = "Confirmed";
        await checkout.save();
        console.log("💳 Payment processed successfully");

        // Deduct stock
        try {
            await axios.put(`${process.env.PRODUCT_SERVICE_URL}/deduct-stock`, {
                productId,
                quantity
            });
            console.log("📦 Stock deducted");
        } catch (err) {
            console.error("❌ Stock deduction failed:", err.response?.data || err.message);
        }

        // Remove from cart
        try {
            await axios.delete(`${process.env.CART_SERVICE_URL}/remove/${productId}`, {
                headers: { Authorization: req.headers.authorization }
            });
            console.log("🧹 Product removed from cart");
        } catch (err) {
            console.error("❌ Failed to remove product from cart:", err.response?.data || err.message);
        }

        return res.status(201).json({
            success: true,
            message: "Single product order placed successfully",
            order: checkout
        });

    } catch (err) {
        console.error("❌ Unexpected error during single product checkout:", err.message);
        return res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};

const getAllOrdersPublic = async (req, res) => {
    try {
        const orders = await Checkout.find().sort({ createdAt: -1 }); // Optional: Sort newest first
        return res.status(200).json({ success: true, orders });
    } catch (err) {
        console.error("❌ Error fetching all orders:", err.message);
        return res.status(500).json({ success: false, message: "Failed to fetch all orders" });
    }
};

const updateShippingStatusPublic = async (req, res) => {
    try {
        const { orderId, shippingStatus } = req.body;

        if (!orderId || !shippingStatus) {
            return res.status(400).json({
                success: false,
                message: "Order ID and shipping status are required"
            });
        }

        const validStatuses = ["Pending", "Shipped", "Delivered"];
        if (!validStatuses.includes(shippingStatus)) {
            return res.status(400).json({
                success: false,
                message: "Invalid shipping status"
            });
        }

        const updatedOrder = await Checkout.findByIdAndUpdate(
            orderId,
            { shippingStatus },
            { new: true }
        );

        if (!updatedOrder) {
            return res.status(404).json({
                success: false,
                message: "Order not found"
            });
        }

        return res.status(200).json({
            success: true,
            message: "Shipping status updated",
            order: updatedOrder
        });

    } catch (err) {
        console.error("❌ Error updating shipping status:", err.message);
        return res.status(500).json({
            success: false,
            message: "Internal Server Error"
        });
    }
};


const getMonthlyStats = async (req, res) => {
    try {
        const now = new Date();
        const currentMonth = now.getMonth() + 1; // JavaScript months are 0-based
        const currentYear = now.getFullYear();
        const previousMonth = currentMonth === 1 ? 12 : currentMonth - 1; // If January, previous month is December
        const previousYear = currentMonth === 1 ? currentYear - 1 : currentYear;

        const stats = await Checkout.aggregate([
            {
                $addFields: {
                    month: { $month: "$createdAt" },
                    year: { $year: "$createdAt" }
                }
            },
            {
                $match: {
                    $or: [
                        // Include current month
                        { year: currentYear, month: currentMonth },
                        // Include previous month
                        { year: previousYear, month: previousMonth }
                    ]
                }
            },
            {
                $group: {
                    _id: { year: "$year", month: "$month" },
                    totalOrders: { $sum: 1 },
                    totalRevenue: { $sum: "$totalAmount" },
                    totalProductsSold: {
                        $sum: {
                            $sum: "$items.quantity"
                        }
                    }
                }
            },
            {
                $sort: { "_id.year": -1, "_id.month": -1 } // Sort by most recent month first
            }
        ]);

        return res.status(200).json({ success: true, stats });
    } catch (err) {
        console.error("❌ Error in getMonthlyStats:", err.message);
        return res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};



module.exports = {
    placeOrder,
    getOrders,
    placeSingleProductOrder,
    getAllOrdersPublic,
    updateShippingStatusPublic,
    getMonthlyStats
};