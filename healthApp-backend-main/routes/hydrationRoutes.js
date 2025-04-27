/* eslint-disable @typescript-eslint/no-require-imports */
const express = require('express');
const router = express.Router();
const hydration = require('../models/hydrationRoute');

// POST /api/water/log ➔ Log water intake
router.post('/log', async (req, res) => {
  const { userId, amount } = req.body;
  const today = new Date().toISOString().split('T')[0];
  try {
    const user = await hydration.findById(userId);

    if (user.hydrationDate !== today) {
      user.hydrationProgress = 0; // Reset progress if it's a new day
      user.hydrationDate = today;
    }

    user.hydrationProgress += amount;
    await user.save();
    res.json({ message: 'Water logged!', totalIntake: user.hydrationProgress });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/hydration/add/:userId ➔ Get today's hydration
router.get('/add/:userId', async (req, res) => {
  const { userId } = req.params;
  const today = new Date().toISOString().split('T')[0];
  try {
    const user = await hydration.findById(userId);

    if (user.hydrationDate !== today) {
      user.hydrationProgress = 0;
      user.hydrationDate = today;
      await user.save();
    }

    res.json({ totalIntake: user.hydrationProgress });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
cron.schedule('0 0 * * *', async () => {
  console.log('🔄 Running daily hydration reset job...');

  const today = new Date().toISOString().split('T')[0];

  try {
    const users = await hydration.find({});

    for (const user of users) {
      if (user.hydrationDate !== today) {
        user.hydrationProgress = 0;
        user.hydrationDate = today;
        await user.save();
      }
    }

    console.log(' Hydration progress reset for all users.');
  } catch (error) {
    console.error(' Error resetting hydration progress:', error.message);
  }
});

module.exports = router;
