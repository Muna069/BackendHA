const mongoose = require("mongoose");

const DailyInsightSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  date: { type: Date, required: true, unique: true },
  totalCaloriesBurned: { type: Number, default: 0 },
  totalSleepHours: { type: Number, default: 0 },
  totalDistance: { type: Number, default: 0 }, 
  heartRateReadings: { type: [Number], default: [] },
  averageHeartRate: { type: Number, default: 0 },
});

module.exports = mongoose.model("DailyInsight", DailyInsightSchema);
