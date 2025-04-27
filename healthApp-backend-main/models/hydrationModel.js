const mongoose = require('mongoose');

const HydrationSchema = new mongoose.Schema({


  hydrationGoal: {
    type: Number,
    default: 2000, // 💧 Default hydration goal in ml (you can change it)
  },
  hydrationProgress: {
    type: Number,
    default: 0, // 💧 How much water they drank today
  },
  hydrationDate: {
    type: String,
    default: new Date().toISOString().split('T')[0], // 💧 Track last updated date (as "YYYY-MM-DD")
  },

  // ... any other fields
});

module.exports = mongoose.model('hydration', HydrationSchema);
