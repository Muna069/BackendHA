/* eslint-disable @typescript-eslint/no-require-imports */

const express = require("express");
const router = express.Router();
const WorkoutProgress = require("../models/workoutProgressModel");
const Exercise = require("../models/exerciseModel"); // Assuming your Exercise model exists
const User = require("../models/userModel"); // Assuming your User model exists

// Log workout progress
router.post("/log-progress", async (req, res) => {
  try {
    const { userId, exerciseId, timeSpent, progressNotes } = req.body;

    if (!userId || !exerciseId || !timeSpent) {
      return res.status(400).json({ message: "User ID, Exercise ID, and Time spent are required" });
    }

    // Check if the user and exercise exist
    const user = await User.findById(userId);
    const exercise = await Exercise.findById(exerciseId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!exercise) {
      return res.status(404).json({ message: "Exercise not found" });
    }

    // Create new progress entry
    const workoutProgress = new WorkoutProgress({
      userId,
      exerciseId,
      timeSpent,
      progressNotes
    });

    await workoutProgress.save();

    res.json({ message: "Workout progress logged successfully", workoutProgress });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get progress for a specific user
router.get("/get-progress/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    // Get all progress entries for the user
    const progress = await WorkoutProgress.find({ userId }).populate('exerciseId', 'name'); // Populate exercise name

    if (progress.length === 0) {
      return res.status(404).json({ message: "No progress found for this user" });
    }

    res.json({ progress });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


module.exports = router;
