/* eslint-disable @typescript-eslint/no-require-imports */
const express = require('express');
const router = express.Router();
const Hydration = require('../models/hydrationModel');
const cron = require('node-cron'); // 🛠 Import Hydration model

// POST /api/hydration/log ➔ Log water intake
router.post('/log', async (req, res) => {
  const { userId, amount } = req.body;
  const today = new Date().toISOString().split('T')[0];

  try {
    let hydration = await Hydration.findOne({ userId });

    if (!hydration) {
      hydration = new Hydration({ userId });
    }

    if (hydration.hydrationDate !== today) {
      hydration.hydrationProgress = 0;
      hydration.hydrationDate = today;
    }

    hydration.hydrationProgress += amount;
    await hydration.save();
    res.json({ message: 'Water logged!', totalIntake: hydration.hydrationProgress });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/hydration/add/:userId ➔ Get today's hydration
router.get('/add/:userId', async (req, res) => {
  const { userId } = req.params;
  const today = new Date().toISOString().split('T')[0];

  try {
    let hydration = await Hydration.findOne({ userId });

    if (!hydration) {
      hydration = new Hydration({ userId });
    }

    if (hydration.hydrationDate !== today) {
      hydration.hydrationProgress = 0;
      hydration.hydrationDate = today;
      await hydration.save();
    }

    res.json({ totalIntake: hydration.hydrationProgress });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// CRON job to reset hydration progress daily

cron.schedule('0 0 * * *', async () => {
  console.log('🔄 Running daily hydration reset job...');
  const today = new Date().toISOString().split('T')[0];

  try {
    const hydrations = await Hydration.find({});

    for (const hydration of hydrations) {
      if (hydration.hydrationDate !== today) {
        hydration.hydrationProgress = 0;
        hydration.hydrationDate = today;
        await hydration.save();
      }
    }

    console.log('✅ Hydration progress reset for all users.');
  } catch (error) {
    console.error('❌ Error resetting hydration progress:', error.message);
  }
});

module.exports = router;
