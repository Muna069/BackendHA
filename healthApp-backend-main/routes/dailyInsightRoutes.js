const express = require("express");
const DailyInsight = require("../models/dailyInsightModel");
const cron = require("node-cron");

const router = express.Router();

// **Update Daily Insights from Smartwatch Data**
router.post("/update", async (req, res) => {
  const { userId, caloriesBurned, sleepMinutes, distance, heartRate } = req.body;

  try {
    const today = new Date().setHours(0, 0, 0, 0);
    let insight = await DailyInsight.findOne({ userId, date: today });

    if (!insight) {
      insight = new DailyInsight({ userId, date: today });
    }

    // Update daily totals
    insight.totalCaloriesBurned += caloriesBurned;
    insight.totalSleepHours += sleepMinutes / 60;
    insight.totalDistance += distance;
    insight.heartRateReadings.push(heartRate);

    await insight.save();
    res.json({ message: "Daily insights updated", insight });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// **Get all daily insights for a user**
router.get("/all/:userId", async (req, res) => {
  try {
    const insights = await DailyInsight.find({ userId: req.params.userId }).sort({ date: -1 });
    res.json(insights);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// **Get a specific day's insights**
router.get("/:userId/:date", async (req, res) => {
  try {
    const date = new Date(req.params.date).setHours(0, 0, 0, 0);
    const insight = await DailyInsight.findOne({ userId: req.params.userId, date });

    if (!insight) return res.status(404).json({ message: "No data found for this date" });

    res.json(insight);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// **Cron Job: Finalize Daily Insights at Midnight**
cron.schedule("0 0 * * *", async () => {
  try {
    const today = new Date().setHours(0, 0, 0, 0);
    const insights = await DailyInsight.find({ date: today });

    for (const insight of insights) {
      if (insight.heartRateReadings.length > 0) {
        const totalHeartRate = insight.heartRateReadings.reduce((a, b) => a + b, 0);
        insight.averageHeartRate = totalHeartRate / insight.heartRateReadings.length;
      }
      insight.heartRateReadings = []; // Reset readings for the next day
      await insight.save();
    }
    console.log("Daily insights finalized.");
  } catch (err) {
    console.error("Error finalizing daily insights:", err);
  }
});

module.exports = router;
