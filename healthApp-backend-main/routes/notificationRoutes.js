const express = require("express");
const router = express.Router();
const Notification = require("../models/notificationModel");


router.get("/:userId", async (req, res) => {
  try {
    const notifications = await Notification.find({ userId: req.params.userId })
      .sort({ createdAt: -1 })
      .populate("exerciseId", "name thumbnail workoutGif");

    res.json(notifications);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


router.get("/count/:userId", async (req, res) => {
  try {
    const unreadCount = await Notification.countDocuments({ userId: req.params.userId, isRead: false });
    res.json({ unreadCount });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put("/mark-as-read/:notificationId", async (req, res) => {
  try {
    const notification = await Notification.findByIdAndUpdate(req.params.notificationId, { isRead: true }, { new: true });

    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    res.json({ message: "Notification marked as read", notification });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;