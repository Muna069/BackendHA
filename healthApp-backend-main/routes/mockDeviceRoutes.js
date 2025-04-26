const express = require("express");
const MockDevice = require("../models/mockDeviceModel");
const DailyData = require("../models/dailyDeviceDataModel");
const User = require("../models/userModel"); // <-- Added for role checking
const cron = require("node-cron");

const router = express.Router();

// **Register a New Mock Device**
router.post("/register", async (req, res) => {
  const { userId, name } = req.body;

  try {
    let device = await MockDevice.findOne({ userId });

    if (device) return res.status(400).json({ message: "Device already registered" });

    device = new MockDevice({ userId, name });
    await device.save();

    res.json({ message: "Mock device registered", device });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// **Get User's Mock Device Data**
router.get("/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const device = await MockDevice.findOne({ userId });

    if (!device) {
      const user = await User.findById(userId);
      if (user?.isAdmin || user?.isTrainer) {
        return res.status(200).json(null); // Suppress error
      }
      return res.status(404).json({ message: "No device found" });
    }

    res.json(device);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// **View Registered Device**
router.get("/registered/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const device = await MockDevice.findOne({ userId });

    if (!device) {
      const user = await User.findById(userId);
      if (user?.isAdmin || user?.isTrainer) {
        return res.status(200).json(null); // Suppress error
      }
      return res.status(404).json({ message: "No registered device found" });
    }

    res.json(device);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// **Delete Device**
router.delete("/:userId", async (req, res) => {
  try {
    const device = await MockDevice.findOneAndDelete({ userId: req.params.userId });

    if (!device) return res.status(404).json({ message: "No registered device found for this user" });

    res.json({ message: "Device deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// **Simulate Real-Time Updates Every Minute**
cron.schedule("* * * * *", async () => {
  try {
    const devices = await MockDevice.find();

    for (const device of devices) {
      const now = new Date();
      const hour = now.getHours();

      // **Heart Rate Simulation** (60 - 120 BPM)
      device.heartRate = Math.floor(Math.random() * (120 - 60 + 1)) + 60;

      // **Steps Simulation** (0 - 5 steps per minute)
      const randomSteps = Math.floor(Math.random() * 5);
      device.stepsCount += randomSteps;

      // **Calories Burned Simulation** (0.04 kcal per step)
      device.caloriesBurned += randomSteps * 0.04;

      // **Sleep Simulation (Only between 10 PM - 6 AM)**
      if (hour >= 22 || hour < 6) {
        device.sleepMinutes += Math.floor(Math.random() * 3); // Random 0-2 min per update
      }

      device.lastUpdated = now;
      await device.save();
    }

    console.log("Mock device data updated.");
  } catch (err) {
    console.error("Error updating mock device data:", err);
  }
});

cron.schedule("0 0 * * *", async () => {
  try {
    const devices = await MockDevice.find();

    for (const device of devices) {
      // 1. Fetch daily heart rate records
      const previousDay = new Date(new Date().setDate(new Date().getDate() - 1));
      const startOfDay = new Date(previousDay.getFullYear(), previousDay.getMonth(), previousDay.getDate(), 0, 0, 0);
      const endOfDay = new Date(previousDay.getFullYear(), previousDay.getMonth(), previousDay.getDate(), 23, 59, 59);

      const heartRateRecords = await HeartRateRecord.find({
        userId: device.userId,
        timestamp: { $gte: startOfDay, $lte: endOfDay },
      });

      // 2. Calculate average heart rate
      let averageHeartRate = 0;
      if (heartRateRecords.length > 0) {
        const totalHeartRate = heartRateRecords.reduce((sum, record) => sum + record.heartRate, 0);
        averageHeartRate = totalHeartRate / heartRateRecords.length;
      }

      // 3. Save daily data to history
      await DailyDeviceData.create({
        userId: device.userId,
        date: previousDay,
        sleepMinutes: device.sleepMinutes,
        heartRate: averageHeartRate, // Save the calculated average
        stepsCount: device.stepsCount,
        caloriesBurned: device.caloriesBurned,
      });
    }

    // Reset current day's stats
    await MockDevice.updateMany({}, {
      $set: { sleepMinutes: 0, stepsCount: 0, caloriesBurned: 0 },
    });

    console.log("Daily stats saved and reset at midnight.");
  } catch (err) {
    console.error("Error handling daily stats:", err);
  }
});

// Get Daily Device History for User
router.get("/history/:userId", async (req, res) => {
  try {
    const history = await DailyData.find({ userId: req.params.userId }).sort({ date: -1 }); 
    res.json(history);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/history/:userId/:date", async(req, res)=>{
  try{
    const date = new Date(req.params.date);
    const history = await DailyData.find({userId: req.params.userId, date: date});
    res.json(history);
  }catch(err){
    res.status(500).json({error: err.message});
  }
})

router.get("/history/yesterday/:userId", async (req, res) => {
  try {
      const userId = req.params.userId; // Correctly get userId from params
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(today.getDate() - 1);
      const yesterdayString = yesterday.toISOString().split("T")[0];

      const yesterdayData = await DailyData.findOne({
          userId: userId, // Correctly use userId
          date: yesterdayString,
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
