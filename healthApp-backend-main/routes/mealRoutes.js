const express = require("express");
const Meal = require("../models/mealModel");
const UserMealRecommendation = require("../models/aiMealSuggestionModel");
const User = require("../models/userModel");
const cron = require("node-cron");
const { uploadMeal } = require("../config/multerConfig");
const { GoogleGenerativeAI } = require('@google/generative-ai');

const path = require('path');

const router = express.Router();

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY);

async function generateGeminiAIResponse(prompt) {
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        return text;
    } catch (error) {
        console.error("Error generating Gemini AI response:", error);
        return null;
    }
}

{/* 
router.post("/add", uploadMeal.single("picture"), async (req, res) => {
  try {
    const { name, calories, nutrition } = req.body;
    const picture = req.file ? req.file.path : null;

    if (!name || !calories || !nutrition) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const newMeal = new Meal({
      name,
      calories,
      picture,
      nutrition,
    });

    await newMeal.save();
    res.status(201).json({ message: "Meal added successfully", meal: newMeal });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

*/}

router.post("/add", uploadMeal.single("picture"), async (req, res) => {
  try {
      const { name, calories, nutrition, userId } = req.body;
      const picture = req.file ? req.file.path : null;

      if (!name || !calories || !nutrition || !userId) { 
          return res.status(400).json({ message: "All fields are required" });
      }

      const newMeal = new Meal({
          name,
          calories,
          picture,
          nutrition,
          userId,
      });

      await newMeal.save();
      res.status(201).json({ message: "Meal added successfully", meal: newMeal });
  } catch (err) {
      res.status(500).json({ error: err.message });
  }
});


router.put("/update/:id", uploadMeal.single("picture"), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, calories, nutrition } = req.body;
    const picture = req.file ? req.file.path : undefined; 

    const updateData = {};
    if (name) updateData.name = name;
    if (calories) updateData.calories = calories;
    if (nutrition) updateData.nutrition = nutrition;
    if (picture) updateData.picture = picture;

    const updatedMeal = await Meal.findByIdAndUpdate(id, updateData, { new: true });

    if (!updatedMeal) {
      return res.status(404).json({ message: "Meal not found" });
    }

    res.json({ message: "Meal updated successfully", meal: updatedMeal });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


router.get("/all", async (req, res) => {
  try {
    const meals = await Meal.find();
    res.json(meals);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/user/:userId', async (req, res) => {
  try {
      const { userId } = req.params;

      const meals = await Meal.find({ userId: userId }).sort({ createdAt: -1 });

      if (!meals || meals.length === 0) {
          return res.status(404).json({ message: 'No meals found for this user.' });
      }

      res.status(200).json(meals);
  } catch (err) {
      res.status(500).json({ error: err.message });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const meal = await Meal.findById(id);

    if (!meal) {
      return res.status(404).json({ message: "Meal not found" });
    }

    res.json(meal);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete("/delete/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const deletedMeal = await Meal.findByIdAndDelete(id);

    if (!deletedMeal) {
      return res.status(404).json({ message: "Meal not found" });
    }

    res.json({ message: "Meal deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/ai-meal-recommendation/:userId", async (req, res) => {
  try {
      const userId = req.params.userId;
      const today = new Date().toISOString().split("T")[0];

      const recommendation = await UserMealRecommendation.findOne({
          userId: userId,
          createdAt: { $gte: new Date(today) }
      });

      if (!recommendation) {
          return res.json({ message: "No AI meal recommendation found for today." });
      }

      res.json({ recommendation: recommendation.recommendationText });
  } catch (error) {
      res.status(500).json({ error: "Error fetching AI meal recommendation." });
  }
});

cron.schedule("30 6 * * *", async () => {
  try {
      console.log("Running AI meal & hydration recommendation job...");

      const users = await User.find(); // Use the imported User model
      if (!users.length) return console.log("No users found.");

      const allMeals = await Meal.find();
      if (!allMeals.length) return console.log("No meals found.");

      const today = new Date().toISOString().split("T")[0];

      for (const user of users) {

          const existingRecommendation = await UserMealRecommendation.findOne({
              userId: user._id,
              createdAt: { $gte: new Date(today) }
          });

          if (existingRecommendation) continue;

          const prompt = `
              Recommend a **full-day meal plan** with a suitable **hydration suggestion** for a user.
              
              User Profile:
              - BMI: ${user.bmi}
              - Age: ${user.age}
              - Sex: ${user.sex}
              - Goal: ${user.goal}
              - Food Allergy: ${user.allergy || "None"}
              - Food Preference: ${user.foodPreference || "None"}
              - Location: ${user.address || "No specific location"}

              Available Meals:
              ${allMeals.map((meal) => `${meal.name}: ${meal.calories} calories, ${meal.nutrition.protein}g protein`).join("\n")}

              **Instructions:**
              - Select **localized meals** based on user's address.
              - Suggest a **healthy drink** for each meal (not just water).
              - Ensure drinks match the meal type (e.g., herbal tea in the morning, fruit juice at lunch).
              - Recommend a **daily hydration target** in liters.

              **Format the response like this:**
              "Health AI recommends you to eat **[Breakfast]** for breakfast with **[Drink]** (**[nutritional values]**), **[Lunch]** for lunch with **[Drink]** (**[nutritional values]**), and **[Dinner]** for dinner with **[Drink]** (**[nutritional values]**). To stay hydrated, you should drink at least **[hydration recommendation]** liters today."
          `;

          const aiResponse = await generateGeminiAIResponse(prompt);
          if (!aiResponse) continue;

          const recommendation = new UserMealRecommendation({
              userId: user._id,
              recommendationText: aiResponse,
              expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
          });

          await recommendation.save();
          console.log(`Assigned AI meal & hydration recommendation to ${user.username}`);
      }
  } catch (error) {
      console.error("Error assigning AI meal recommendations:", error.message);
  }
});

cron.schedule("0 0 * * *", async () => {
  try {
      console.log("Running expired meal recommendation cleanup...");
      const result = await UserMealRecommendation.deleteMany({ expiresAt: { $lte: new Date() } });
      console.log(`Deleted ${result.deletedCount} expired AI meal recommendations.`);
  } catch (error) {
      console.error("Error deleting expired meal recommendations:", error.message);
  }
});


module.exports = router;
