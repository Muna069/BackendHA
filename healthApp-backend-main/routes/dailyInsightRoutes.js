/* eslint-disable @typescript-eslint/no-require-imports */
const express = require("express");
const DailyInsight = require("../models/dailyInsightModel");
const cron = require("node-cron");
const MockDevice = require("../models/mockDeviceModel");
const DailyDeviceData = require("../models/dailyDeviceDataModel");

const router = express.Router();

// CRON job to save daily data at midnight
cron.schedule("0 0 * * *", async () => {
  try {
    const devices = await MockDevice.find();

    for (const device of devices) {
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Set time to midnight

      const averageHeartRate = device.heartRate; // Or your average calculation logic

      const dailyData = new DailyDeviceData({
        userId: device.userId,
        date: today, // Save as Date object (not a timestamp number)
        sleepMinutes: device.sleepMinutes,
        heartRate: averageHeartRate,
        stepsCount: device.stepsCount,
        caloriesBurned: device.caloriesBurned,
      });

      await dailyData.save();
    }

    // Reset MockDevice data
    await MockDevice.updateMany({}, {
      $set: {
        sleepMinutes: 0,
        stepsCount: 0,
        caloriesBurned: 0,
      },
    });

    console.log("Daily data saved and MockDevice data reset.");
  } catch (err) {
    console.error("Error saving daily data:", err);
  }
});

// GET full history sorted by date
router.get("/history/:userId", async (req, res) => {
  try {
    const history = await DailyDeviceData.find({ userId: req.params.userId }).sort({ date: -1 });
    res.json(history);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET yesterday's history for a user (safer date range query)
router.get("/history/yesterday/:userId", async (req, res) => {
  try {
    const userId = req.params.userId;

    const today = new Date();
    const startOfYesterday = new Date(today);
    startOfYesterday.setDate(today.getDate() - 1);
    startOfYesterday.setHours(0, 0, 0, 0);

    const endOfYesterday = new Date(startOfYesterday);
    endOfYesterday.setHours(23, 59, 59, 999);

    const yesterdayData = await DailyDeviceData.findOne({
      userId: userId,
      date: {
        $gte: startOfYesterday,
        $lte: endOfYesterday,
      },
    });

    if (!yesterdayData) {
      return res.status(404).json({ message: "No data found for yesterday." });
    }

    res.json(yesterdayData);
  } catch (err) {
    console.error("Error fetching yesterday's data:", err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
