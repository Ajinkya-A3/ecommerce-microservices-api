const express = require("express");

const app = express();
app.use(express.json());

// Dummy Payment API - Always returns success
app.post("/api/payment", (req, res) => {
    return res.status(200).json({
        status: "success" // Ensures payment is always successful
    });
});

const PORT = process.env.PORT || 5007;
app.listen(PORT, () => {
    console.log(`Payment Service running on port ${PORT}`);
});
