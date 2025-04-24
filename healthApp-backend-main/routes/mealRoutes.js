const express = require("express");
const axios = require("axios");
const Meal = require("../models/mealModel");
const User = require("../models/userModel");
const UserMealRecommendation = require("../models/aiMealSuggestionModel");
const { generateGeminiAIResponse } = require("../utils/geminiAI");
const cron = require("node-cron");

const router = express.Router();

// Route: Search Meals from Edamam API (Search Bar)
router.get("/search", async (req, res) => {
  try {
    const query = req.query.q;
    if (!query) {
      return res.status(400).json({ message: "Query parameter is required" });
    }

    const appId = ("767233da");
    const appKey = ("49cb1cd66bfdd55d6ebba648f01d6ea7");

    const edamamUrl = `https://api.edamam.com/api/food-database/v2/parser?ingr=${encodeURIComponent(query)}&app_id=${appId}&app_key=${appKey}`;

    const response = await axios.get(edamamUrl);
    const hints = response.data.hints || [];

    const meals = hints.map((item) => {
      const food = item.food;
      return {
        name: food.label,
        calories: food.nutrients.ENERC_KCAL,
        nutrition: {
          protein: food.nutrients.PROCNT,
          fat: food.nutrients.FAT,
          carbs: food.nutrients.CHOCDF,
          fiber: food.nutrients.FIBTG || 0,
        },
      };
    });

    res.status(200).json(meals);
  } catch (error) {
    res.status(500).json({ error: "Error fetching data from Edamam." });
  }
});

// Route: Fetch nutrition data from Edamam for a given meal string
router.get("/meal-nutrition", async (req, res) => {
  const { Meal } = req.query;
  if (!Meal) {
    return res.status(400).json({ error: "Meal name is required" });
  }

  try {
    const response = await axios.get("https://api.edamam.com/api/nutrition-data", {
      params: {
        app_id: process.env.EDAMAM_APP_ID,
        app_key: process.env.EDAMAM_APP_KEY,
        'nutrition-type': 'logging',
        ingr: Meal,
      },
    });

    const data = response.data;
    const nutrition = {
      calories: data.calories,
      carbs: data.totalNutrients?.CHOCDF?.quantity || 0,
      protein: data.totalNutrients?.PROCNT?.quantity || 0,
      fat: data.totalNutrients?.FAT?.quantity || 0,
      fiber: data.totalNutrients?.FIBTG?.quantity || 0,
    };

    res.json({ Meal, nutrition });

  } catch (error) {
    res.status(500).json({ error: "Failed to fetch nutrition data" });
  }
});

// Add meal
router.post("/add", async (req, res) => {
  try {
    const { name, calories, nutrition } = req.body;

    if (!name || !calories || !nutrition) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const newMeal = new Meal({
      name,
      calories,
      nutrition,
    });

    await newMeal.save();
    res.status(201).json({ message: "Meal added successfully", meal: newMeal });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all meals
router.get("/all", async (req, res) => {
  try {
    const meals = await Meal.find();
    res.json(meals);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get a single meal
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

// Delete a meal
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

// AI Recommendation
router.get("/ai-meal-recommendation/:userId", async (req, res) => {
  try {
    const userId = req.params.userId;
    const today = new Date().toISOString().split("T")[0];
    const recommendation = await UserMealRecommendation.findOne({
      userId,
      createdAt: { $gte: new Date(today) },
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
