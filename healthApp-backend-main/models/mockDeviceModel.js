const mongoose = require("mongoose");

const MockDeviceSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  name: { type: String, required: true }, // Device name (Fitbit, Apple Watch, etc.)
  sleepMinutes: { type: Number, default: 0 }, // Total sleep tracked (in minutes)
  heartRate: { type: Number, default: 70 }, // Beats per minute (BPM)
  stepsCount: { type: Number, default: 0 }, // Total steps walked
  caloriesBurned: { type: Number, default: 0 }, // Total calories burned
  lastUpdated: { type: Date, default: Date.now }, // Tracks last update time
});

module.exports = mongoose.model("MockDevice", MockDeviceSchema);
