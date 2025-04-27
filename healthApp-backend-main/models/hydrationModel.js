const mongoose = require('mongoose');

const HydrationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User',
  },
  hydrationGoal: {
    type: Number,
    default: 2000,
  },
  hydrationProgress: {
    type: Number,
    default: 0,
  },
  hydrationDate: {
    type: String,
    default: new Date().toISOString().split('T')[0],
  },
});

module.exports = mongoose.model('Hydration', HydrationSchema);
