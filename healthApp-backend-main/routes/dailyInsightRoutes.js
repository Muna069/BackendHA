const express = require("express");
const DailyInsight = require("../models/dailyInsightModel");
const cron = require("node-cron");
const MockDevice = require("../models/mockDeviceModel"); 
const DailyDeviceData = require("../models/dailyDeviceDataModel");

const router = express.Router();



cron.schedule("0 0 * * *", async () => {
  try {
      const devices = await MockDevice.find();

      for (const device of devices) {
          const today = new Date().setHours(0, 0, 0, 0);

          const averageHeartRate = device.heartRate; // Or your average calculation logic

          const dailyData = new DailyDeviceData({
              userId: device.userId,
              date: today,
              sleepMinutes: device.sleepMinutes,
              heartRate: averageHeartRate,
              stepsCount: device.stepsCount,
              caloriesBurned: device.caloriesBurned,
          });

          await dailyData.save();
      }

      // Reset MockDevice data
      await MockDevice.updateMany({}, {
          $set: { sleepMinutes: 0, stepsCount: 0, caloriesBurned: 0 },
      });

      console.log("Daily data saved and MockDevice data reset.");
  } catch (err) {
      console.error("Error saving daily data:", err);
  }
});

router.get("/history/:userId", async (req, res) => {
  try {
      const history = await DailyDeviceData.find({ userId: req.params.userId }).sort({ date: -1 });
      res.json(history);
  } catch (err) {
      res.status(500).json({ error: err.message });
  }
});

// Get yesterday's history for a user
router.get("/history/yesterday/:userId", async (req, res) => {
  try {
      const userId = req.params.userId;
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(today.getDate() - 1);
      yesterday.setHours(0, 0, 0, 0);

      const yesterdayData = await DailyDeviceData.findOne({ userId: userId, date: yesterday });

      if (!yesterdayData) {
          return res.status(404).json({ message: "No data found for yesterday." });
      }

      res.json(yesterdayData);
  } catch (err) {
      console.error("Error fetching yesterday's data:", err);
      res.status(500).json({ error: err.message });
  }
});


/*


*/

module.exports = router;
