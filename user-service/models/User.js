const mongoose = require("mongoose");

// User schema with role-based authentication
const UserSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { 
        type: String, 
        enum: ["admin", "seller", "customer"], 
        default: "customer" 
    }
}, { timestamps: true });

module.exports = mongoose.model("User", UserSchema);
