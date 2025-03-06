const Order = require("../models/Order");
const axios = require("axios");
const { publishMessage } = require("../services/rabbitMQService");

async function placeOrder(req, res) {
    try {
        const userId = req.user.id;
        const { orderedItems, totalAmount } = req.body;

        const newOrder = new Order({ userId, items: orderedItems, totalAmount, status: "Pending" });
        await newOrder.save();

        // Make Payment API Call
        const paymentResponse = await axios.post(`${process.env.PAYMENT_SERVICE_URL}/api/payment`, {
            userId, amount: totalAmount, orderId: newOrder._id
        });

        if (paymentResponse.data.success) {
            newOrder.status = "Paid";
            await newOrder.save();

            // Notify Other Services
            await publishMessage("order_queue", { orderId: newOrder._id, userId, items: orderedItems });

            res.status(201).json({ success: true, message: "Order placed successfully", order: newOrder });
        } else {
            res.status(400).json({ success: false, message: "Payment Failed" });
        }
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}

module.exports = { placeOrder };
