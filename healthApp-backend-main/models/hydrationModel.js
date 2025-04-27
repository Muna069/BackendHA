/* eslint-disable @typescript-eslint/no-require-imports */
const mongoose = require('mongoose');

const HydrationSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true,
        unique: true, // 📌 optional: only if one hydration document per user
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
