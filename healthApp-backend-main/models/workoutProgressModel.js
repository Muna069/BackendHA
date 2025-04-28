const mongoose = require('mongoose');

const WorkoutProgressSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // Link to User model
        required: true
      },
      exerciseId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Exercise', // Link to Exercise model
        required: true
      },
      timeSpent: {
        type: Number, // Time spent on the workout in minutes
        required: true
      },
      progressNotes: {
        type: String, // Additional progress notes like how the user felt
        default: ''
      },
      completedAt: {
        type: Date,
        default: Date.now
      }
    });

module.exports = mongoose.model('WorkoutProgress', WorkoutProgressSchema);
