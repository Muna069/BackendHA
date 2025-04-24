const mongoose = require('mongoose');

const aiExerciseSuggestionModel = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  exerciseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Exercise', required: true },
  assignedByType: { type: String, enum: ['ai', 'trainer'], required: true },
  assignedAt: { type: Date, default: Date.now },
  expiresAt: { type: Date }
});

module.exports = mongoose.model('AiExercise', aiExerciseSuggestionModel);
