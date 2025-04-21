const mongoose = require("mongoose");

const NotificationSchema = new mongoose.Schema(
    {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        trainerId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        exerciseId: { type: mongoose.Schema.Types.ObjectId, ref: "Exercise", required: true },
        message: { type: String, required: true },
        isRead: { type: Boolean, default: false },
    },
    { timestamps: true }
);

module.exports = mongoose.model("Notification", NotificationSchema);