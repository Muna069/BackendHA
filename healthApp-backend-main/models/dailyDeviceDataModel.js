const mongoose = require("mongoose");

const DailyDeviceDataSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  date: { type: Date, required: true },
  sleepMinutes: { type: Number, required: true },
  heartRate: { type: Number, required: true },
  stepsCount: { type: Number, required: true },
  caloriesBurned: { type: Number, required: true },
});

module.exports = mongoose.model("DailyDeviceData", DailyDeviceDataSchema);
