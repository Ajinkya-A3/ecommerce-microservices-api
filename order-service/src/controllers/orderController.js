const Order = require("../models/Order");
const axios = require("axios");
const { publishMessage } = require("../services/rabbitMQService");

async function placeOrder(req, res) {
    try {
        const userId = req.user.id;
        const { orderedItems, totalAmount } = req.body;

        // ✅ Validate input
        if (!orderedItems || orderedItems.length === 0 || !totalAmount) {
            return res.status(400).json({ success: false, message: "Invalid order request" });
        }

        // ✅ Create new order with "Pending" status
        const newOrder = new Order({ userId, items: orderedItems, totalAmount, status: "Pending" });
        await newOrder.save();
        console.log("🛒 New Order Created:", newOrder);

        // ✅ Make Payment API Call
        const paymentURL = `${process.env.PAYMENT_SERVICE_URL}/api/payment`;
        console.log("💳 Sending Payment Request to:", paymentURL);

        let paymentResponse;
        try {
            paymentResponse = await axios.post(paymentURL, {
                userId,
                amount: totalAmount,
                orderId: newOrder._id,
            });
        } catch (paymentError) {
            console.error("❌ Payment Service Error:", paymentError.response?.data || paymentError.message);
            return res.status(400).json({ success: false, message: "Payment Failed" });
        }

        // ✅ Payment Validation
        if (paymentResponse.data.status !== "success") {
            console.error("❌ Payment Failed:", paymentResponse.data);
            return res.status(400).json({ success: false, message: "Payment Failed" });
        }

        console.log("💰 Payment Successful:", paymentResponse.data);

        // ✅ Deduct Stock for Each Ordered Product
        const productURL = `${process.env.PRODUCT_SERVICE_URL}/api/products/deduct-stock`;
        for (const item of orderedItems) {
            try {
                await axios.put(productURL, {
                    productId: item.productId,
                    quantity: item.quantity,
                });
                console.log(`📉 Stock Deducted for Product ID: ${item.productId}`);
            } catch (stockError) {
                console.error(`❌ Stock Deduction Failed for Product ID: ${item.productId}:`, stockError.message);
            }
        }

        
        // ✅ Remove Ordered Items from the Cart
        const cartURL = `${process.env.CART_SERVICE_URL}/api/cart/remove-items/${userId}`;
        try {
            // Convert orderedItems array to just an array of productIds
            const productIds = orderedItems.map(item => item.productId);

            await axios.put(cartURL, {
                orderedItems: productIds,  // Sending only productIds
                quantity: orderedItems.length  // Sending the correct quantity
            });

            console.log("🛒 Ordered Items Removed from Cart");
        } catch (cartError) {
            console.error("❌ Failed to Remove Items from Cart:", cartError.response?.data || cartError.message);
        }



        // ✅ Update Order Status to "Paid"
        newOrder.status = "Paid";
        await newOrder.save();

        // ✅ Notify Other Services via RabbitMQ
        const message = { orderId: newOrder._id, userId, items: orderedItems };
        console.log("📢 Publishing Message to Queue:", message);
        await publishMessage("order_queue", message);

        return res.status(201).json({ success: true, message: "Order placed successfully", order: newOrder });

    } catch (error) {
        console.error("❌ Order Placement Error:", error.message);
        return res.status(500).json({ success: false, message: "Internal Server Error" });
    }
}

module.exports = { placeOrder };
