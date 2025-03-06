const express = require("express");

const app = express();
app.use(express.json());

// Dummy Payment API - Always returns success
app.post("/api/payment", (req, res) => {
    return res.status(200).json({
        status: "success" // Payment always succeeds
    });
});

// Dummy Refund API - Always returns success
app.post("/api/refund", (req, res) => {
    return res.status(200).json({
        status: "success" // Refund always succeeds
    });
});

const PORT = process.env.PORT || 5007;
app.listen(PORT, () => {
    console.log(`Payment Service running on port ${PORT}`);
});
