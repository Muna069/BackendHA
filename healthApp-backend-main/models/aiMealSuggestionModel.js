const mongoose = require("mongoose");

const userMealRecommendationSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    recommendationText: { type: String, required: true },
    expiresAt: { type: Date, required: true } // Expiration time (24 hours)
}, { timestamps: true });

module.exports = mongoose.model("UserMealRecommendation", userMealRecommendationSchema);
