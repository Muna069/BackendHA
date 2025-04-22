/* eslint-disable @typescript-eslint/no-require-imports */
const express = require("express");
const Exercise = require("../models/exerciseModel");
const Notification = require("../models/notificationModel");
const User = require("../models/userModel");
const cron = require("node-cron");
const { uploadExercise } = require("../config/multerConfig");
const { GoogleGenerativeAI } = require('@google/generative-ai');

const path = require('path');

const router = express.Router();

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY);

async function generateGeminiAIResponse(prompt) {
  try {
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" }); // Use gemini-1.5-flash
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      return text;
  } catch (error) {
      console.error("Error generating Gemini AI response:", error);
      return null;
  }
}


router.post("/add", uploadExercise.fields([
  { name: "thumbnail", maxCount: 1 },
  { name: "workoutGif", maxCount: 1 }
]), async (req, res) => {
  try {
    const { name, description, reps, time } = req.body;

    if (!name || !description || !reps || !time || !req.files["thumbnail"] || !req.files["workoutGif"]) {
      return res.status(400).json({ message: "All fields including images are required" });
    }

    const newExercise = new Exercise({
      name,
      description,
      reps,
      time,
      thumbnail: req.files["thumbnail"][0].path,
      workoutGif: req.files["workoutGif"][0].path,
    });

    await newExercise.save();
    res.status(201).json({ message: "Exercise added successfully", exercise: newExercise });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put("/update/:id", uploadExercise.fields([
  { name: "thumbnail", maxCount: 1 },
  { name: "workoutGif", maxCount: 1 }
]), async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    if (req.files["thumbnail"]) {
      updates.thumbnail = req.files["thumbnail"][0].path;
    }
    if (req.files["workoutGif"]) {
      updates.workoutGif = req.files["workoutGif"][0].path;
    }

    const updatedExercise = await Exercise.findByIdAndUpdate(id, updates, { new: true });

    if (!updatedExercise) {
      return res.status(404).json({ message: "Exercise not found" });
    }

    res.json({ message: "Exercise updated successfully", exercise: updatedExercise });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/all", async (req, res) => {
    try {
      const exercises = await Exercise.find();
  
      const updatedExercises = exercises.map((exercise) => {
        const now = new Date();
        const lastCompleted = exercise.lastCompleted;
        const isDone = lastCompleted && now - lastCompleted < 24 * 60 * 60 * 1000;
  
        return { ...exercise.toObject(), isDone };
      });
  
      res.json(updatedExercises);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  router.get("/count", async (req, res) => {
    try {
      const count = await Exercise.countDocuments();
      res.json({ count });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
  
  cron.schedule("0 0 * * *", async () => {
    try {
      await Exercise.updateMany({}, { lastCompleted: null });
      console.log("All exercises reset at midnight");
    } catch (err) {
      console.error("Error resetting exercises:", err);
    }
  });
  
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const exercise = await Exercise.findById(id);

    if (!exercise) {
      return res.status(404).json({ message: "Exercise not found" });
    }

    res.json(exercise);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete("/delete/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const deletedExercise = await Exercise.findByIdAndDelete(id);

    if (!deletedExercise) {
      return res.status(404).json({ message: "Exercise not found" });
    }

    res.json({ message: "Exercise deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/complete/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const exercise = await Exercise.findById(id);
  
      if (!exercise) {
        return res.status(404).json({ message: "Exercise not found" });
      }
  
      exercise.lastCompleted = new Date();
      await exercise.save();
  
      res.json({ message: "Exercise marked as completed", exercise });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // Route to get AI-assigned exercises for a user
router.get("/ai-assigned-exercises/:userId", async (req, res) => {
    try {
        const userId = req.params.userId;
        const exercises = await Exercise.find({ assignedTo: userId, assignedByType: "ai" });
        res.json(exercises);
    } catch (error) {
        res.status(500).json({ error: "Error fetching AI-assigned exercises" });
    }
});

// Route to get trainer-assigned exercises for a user
router.get("/trainer-assigned-exercises/:userId", async (req, res) => {
    try {
        const userId = req.params.userId;
        const exercises = await Exercise.find({ assignedTo: userId, assignedByType: "trainer" });
        res.json(exercises);
    } catch (error) {
        res.status(500).json({ error: "Error fetching trainer-assigned exercises" });
    }
});


  // Assign exercise and send a notification
router.post("/assign-exercise", async (req, res) => {
    try {
      const { trainerId, userId, exerciseId } = req.body;
  
      if (!trainerId || !userId || !exerciseId) {
        return res.status(400).json({ message: "Trainer ID, User ID, and Exercise ID are required" });
      }
  
      const trainer = await User.findById(trainerId);
      const user = await User.findById(userId);
      const exercise = await Exercise.findById(exerciseId);
  
      if (!trainer || !trainer.isTrainer) {
        return res.status(404).json({ message: "Invalid trainer ID" });
      }
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      if (!exercise) {
        return res.status(404).json({ message: "Exercise not found" });
      }
  
      // Save notification
      const notification = new Notification({
        userId,
        trainerId,
        exerciseId,
        message: "Your trainer assigned an exercise to you.",
      });
  
      await notification.save();
  
      res.json({ message: "Exercise assigned and notification created", notification });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
  

  router.post("/ai-assign-exercise/:userId", async (req, res) => {
    try {
        const { userId } = req.params;
        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ message: "User not found." });

        // Get today's date in YYYY-MM-DD format
        const today = new Date().toISOString().split("T")[0];

        // Check how many AI-assigned exercises the user already has for today
        const todayExercises = await Exercise.find({
            assignedTo: userId,
            assignedByType: "ai",
            createdAt: { $gte: new Date(today) }, // Fetch today's exercises
        });

        if (todayExercises.length >= 2) {
            return res.status(400).json({ message: "User already has 2 AI-assigned exercises for today." });
        }

        // Fetch all exercises from the database
        const allExercises = await Exercise.find();
        if (allExercises.length === 0) {
            return res.status(404).json({ message: "No exercises found in the database." });
        }

        // Construct AI prompt
        const prompt = `
            Recommend up to 2 exercises for a user with these attributes:
            - BMI: ${user.bmi}
            - Age: ${user.age}
            - Sex: ${user.sex}
            - Goal: ${user.goal}

            Choose from this list:
            ${allExercises.map((ex) => `${ex.name}: ${ex.description}`).join("\n")}

            Respond with a list of 1 or 2 exercise names.
        `;

        // Get AI response
        const aiResponse = await generateGeminiAIResponse(prompt);
        const exerciseNames = aiResponse.split("\n").slice(0, 2); // Extract up to 2 exercises

        // Find the selected exercises in the database
        const selectedExercises = allExercises.filter((ex) => exerciseNames.includes(ex.name));

        if (selectedExercises.length === 0) {
            return res.status(400).json({ message: "AI could not select valid exercises." });
        }

        // Assign the exercises to the user
        const assignedExercises = selectedExercises.map((ex) => ({
            name: ex.name,
            description: ex.description,
            reps: ex.reps,
            time: ex.time,
            thumbnail: ex.thumbnail,
            workoutGif: ex.workoutGif,
            assignedTo: userId,
            assignedByType: "ai",
        }));

        await Exercise.insertMany(assignedExercises);

        res.json({ message: "AI exercises assigned successfully", assignedExercises });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get("/ai-assigned-exercises/:userId", async (req, res) => {
    try {
        const { userId } = req.params;

        // Fetch today's AI-assigned exercises
        const today = new Date().toISOString().split("T")[0];
        const exercises = await Exercise.find({
            assignedTo: userId,
            assignedByType: "ai",
            createdAt: { $gte: new Date(today) },
        });

        res.json({ aiAssignedExercises: exercises });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

  //Route to get AI-assigned exercises for a user (only today's exercises)
router.get("/ai-assigned-exercises/:userId", async (req, res) => {
    try {
        const userId = req.params.userId;
        const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

        const exercises = await Exercise.find({
            assignedTo: userId,
            assignedByType: "ai",
            createdAt: { $gte: new Date(today) },
        });

        res.json(exercises);
    } catch (error) {
        res.status(500).json({ error: "Error fetching AI-assigned exercises" });
    }
});

// Route to get trainer-assigned exercises for a user (only today's exercises)
router.get("/trainer-assigned-exercises/:userId", async (req, res) => {
    try {
        const userId = req.params.userId;
        const today = new Date().toISOString().split("T")[0];

        const exercises = await Exercise.find({
            assignedTo: userId,
            assignedByType: "trainer",
            createdAt: { $gte: new Date(today) },
        });

        res.json(exercises);
    } catch (error) {
        res.status(500).json({ error: "Error fetching trainer-assigned exercises" });
    }
});

// Route for a trainer to assign an exercise to a user (expires after a day)
router.post("/assign-exercise", async (req, res) => {
    try {
        const { trainerId, userId, exerciseId } = req.body;

        const trainer = await User.findById(trainerId);
        const user = await User.findById(userId);
        const exercise = await Exercise.findById(exerciseId);

        if (!trainer || !trainer.isTrainer) {
            return res.status(403).json({ error: "Trainer not authorized" });
        }
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }
        if (!exercise) {
            return res.status(404).json({ error: "Exercise not found" });
        }

        const assignedExercise = new Exercise({
            name: exercise.name,
            description: exercise.description,
            reps: exercise.reps,
            time: exercise.time,
            thumbnail: exercise.thumbnail,
            workoutGif: exercise.workoutGif,
            assignedTo: user._id,
            assignedBy: trainer._id,
            assignedByType: "trainer",
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // Expires in 24 hours
        });

        await assignedExercise.save();
        res.json({ message: "Exercise assigned successfully", exercise: assignedExercise });
    } catch (error) {
        res.status(500).json({ error: "Error assigning exercise" });
    }
});

// AI Exercise Assignment Cron Job (Runs at 6:00 AM Daily)
cron.schedule("0 6 * * *", async () => {
    try {
        console.log("Running AI exercise assignment job...");

        const users = await User.find();
        if (!users.length) return console.log("No users found.");

        const allExercises = await Exercise.find();
        if (!allExercises.length) return console.log("No exercises found.");

        const today = new Date().toISOString().split("T")[0];

        for (const user of users) {
            // Check if user already has 2 AI-assigned exercises for today
            const todayExercises = await Exercise.find({
                assignedTo: user._id,
                assignedByType: "ai",
                createdAt: { $gte: new Date(today) },
            });

            if (todayExercises.length >= 2) continue;

            // Generate AI prompt
            const prompt = `
                Recommend up to 2 exercises for a user with these attributes:
                - BMI: ${user.bmi}
                - Age: ${user.age}
                - Sex: ${user.sex}
                - Goal: ${user.goal}

                Choose from this list:
                ${allExercises.map((ex) => `${ex.name}: ${ex.description}`).join("\n")}

                Respond with a list of 1 or 2 exercise names.
            `;

            const aiResponse = await generateGeminiAIResponse(prompt);
            const exerciseNames = aiResponse ? aiResponse.split("\n").slice(0, 2) : [];

            const selectedExercises = allExercises.filter((ex) => exerciseNames.includes(ex.name));
            if (!selectedExercises.length) continue;

            const assignedExercises = selectedExercises.map((ex) => ({
                name: ex.name,
                description: ex.description,
                reps: ex.reps,
                time: ex.time,
                thumbnail: ex.thumbnail,
                workoutGif: ex.workoutGif,
                assignedTo: user._id,
                assignedByType: "ai",
                expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // Expires in 24 hours
            }));

            await Exercise.insertMany(assignedExercises);
            console.log(`Assigned ${assignedExercises.length} AI exercises to ${user.username}`);
        }
    } catch (error) {
        console.error("Error assigning AI exercises:", error.message);
    }
});

// Daily Cleanup: Delete Expired Exercises (Runs at 12:00 AM Daily)
cron.schedule("0 0 * * *", async () => {
    try {
        console.log("Running expired exercise cleanup...");
        const result = await Exercise.deleteMany({ expiresAt: { $lte: new Date() } });
        console.log(`Deleted ${result.deletedCount} expired exercises.`);
    } catch (error) {
        console.error("Error deleting expired exercises:", error.message);
    }
});

router.post("/assign-workout", async (req, res) => {
  try {
      const { workoutId, userId } = req.body;

      if (!workoutId || !userId) {
          return res.status(400).json({ message: "Workout ID and User ID are required" });
      }

      const user = await User.findById(userId);
      const exercise = await Exercise.findById(workoutId);

      if (!user) {
          return res.status(404).json({ message: "User not found" });
      }
      if (!exercise) {
          return res.status(404).json({ message: "Workout not found" });
      }

      exercise.assignedTo.push(userId);
      exercise.assignedBy.push(req.user ? req.user._id : null);
      exercise.assignedByType = "trainer";
      exercise.expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

      await exercise.save();

      const notification = new Notification({
          userId: userId,
          message: `A workout "${exercise.name}" has been assigned to you.`,
          exerciseId: exercise._id,
          trainerId: req.user ? req.user._id : null,
      });

      await notification.save();

      res.json({ message: "Workout assigned successfully and notification sent", exercise, notification });
  } catch (err) {
      res.status(500).json({ error: err.message });
  }
});

router.post("/ai-assign-workout/:userId", async (req, res) => {
  try {
      const { userId } = req.params;
      const user = await User.findById(userId);
      if (!user) return res.status(404).json({ message: "User not found." });

      const today = new Date().toISOString().split("T")[0];

      const todayExercises = await Exercise.find({
          assignedTo: userId,
          assignedByType: "ai",
          createdAt: { $gte: new Date(today) },
      });

      if (todayExercises.length >= 2) {
          return res.status(400).json({ message: "User already has 2 AI-assigned workouts for today." });
      }

      const allExercises = await Exercise.find();
      if (allExercises.length === 0) {
          return res.status(404).json({ message: "No workouts found in the database." });
      }

      const prompt = `
          Recommend up to 2 exercises for a user with these attributes:
          - BMI: ${user.bmi}
          - Age: ${user.age}
          - Sex: ${user.sex}
          - Goal: ${user.goal}

          Choose from this list:
          ${allExercises.map((ex) => `${ex.name}: ${ex.description}`).join("\n")}

          Respond with a list of 1 or 2 exercise names.
      `;

      const aiResponse = await generateGeminiAIResponse(prompt);
      if (!aiResponse) {
          return res.status(500).json({ message: "AI response was empty or failed." });
      }

      const workoutNames = aiResponse.split("\n").slice(0, 2);

      const selectedWorkouts = allExercises.filter((ex) => workoutNames.includes(ex.name));

      if (selectedWorkouts.length === 0) {
          return res.status(400).json({ message: "AI could not select valid workouts." });
      }

      const assignedWorkouts = selectedWorkouts.map((workout) => ({
          name: workout.name,
          description: workout.description,
          reps: workout.reps,
          time: workout.time,
          thumbnail: workout.thumbnail,
          workoutGif: workout.workoutGif,
          assignedTo: userId,
          assignedByType: "ai",
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // Expires in 24 hours
      }));

      await Exercise.insertMany(assignedWorkouts);

      // Create notifications for each assigned workout
      for (const workout of assignedWorkouts) {
          const notification = new Notification({
              userId: userId,
              message: `AI assigned workout: "${workout.name}"`,
              exerciseId: workout._id,
          });
          await notification.save();
      }

      res.json({ message: "AI workouts assigned successfully", assignedWorkouts });
  } catch (error) {
      res.status(500).json({ error: error.message });
  }
});

// AI Workout Assignment Cron Job (Runs at 6:00 AM Daily)
cron.schedule("0 6 * * *", async () => {
  try {
      console.log("Running AI workout assignment job...");

      const users = await User.find();
      if (!users.length) return console.log("No users found.");

      const allExercises = await Exercise.find();
      if (!allExercises.length) return console.log("No workouts found.");

      const today = new Date().toISOString().split("T")[0];

      for (const user of users) {
          const todayWorkouts = await Exercise.find({
              assignedTo: user._id,
              assignedByType: "ai",
              createdAt: { $gte: new Date(today) },
          });

          if (todayWorkouts.length >= 2) continue;

          const prompt = `
              Recommend up to 2 exercises for a user with these attributes:
              - BMI: ${user.bmi}
              - Age: ${user.age}
              - Sex: ${user.sex}
              - Goal: ${user.goal}

              Choose from this list:
              ${allExercises.map((ex) => `${ex.name}: ${ex.description}`).join("\n")}

              Respond with a list of 1 or 2 exercise names.
          `;

          const aiResponse = await generateGeminiAIResponse(prompt);
          if (!aiResponse) {
              console.error(`AI response failed for user ${user.username}. Skipping.`);
              continue;
          }

          const workoutNames = aiResponse.split("\n").slice(0, 2);

          const selectedWorkouts = allExercises.filter((ex) => workoutNames.includes(ex.name));
          if (!selectedWorkouts.length) continue;

          const assignedWorkouts = selectedWorkouts.map((workout) => ({
              name: workout.name,
              description: workout.description,
              reps: workout.reps,
              time: workout.time,
              thumbnail: workout.thumbnail,
              workoutGif: workout.workoutGif,
              assignedTo: user._id,
              assignedByType: "ai",
              expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
          }));

          await Exercise.insertMany(assignedWorkouts);

          for (const workout of assignedWorkouts) {
              const notification = new Notification({
                  userId: user._id,
                  message: `AI assigned workout: "${workout.name}"`,
                  exerciseId: workout._id,
              });
              await notification.save();
          }

          console.log(`Assigned ${assignedWorkouts.length} AI workouts to ${user.username}`);
      }
  } catch (error) {
      console.error("Error assigning AI workouts:", error.message);
  }
});
/*
router.get("/ai-assigned-exercises/:userId", async (req, res) => {
  try {
      const userId = req.params.userId;
      const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

      const exercises = await Exercise.find({
          assignedTo: userId,
          assignedByType: "ai",
          createdAt: { $gte: new Date(today) },
      });

      res.json(exercises);
  } catch (error) {
      res.status(500).json({ error: "Error fetching AI-assigned exercises" });
  }
});*/

router.get("/trainer-assigned-exercises/:userId", async (req, res) => {
  try {
      const userId = req.params.userId;
      const today = new Date().toISOString().split("T")[0];

      const exercises = await Exercise.find({
          assignedTo: userId,
          assignedByType: "trainer",
          createdAt: { $gte: new Date(today) },
      });

      res.json(exercises);
  } catch (error) {
      res.status(500).json({ error: "Error fetching trainer-assigned exercises" });
  }
});

module.exports = router;
