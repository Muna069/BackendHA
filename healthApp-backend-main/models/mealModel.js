const mongoose = require('mongoose');

const mealSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    calories: { type: String, required: true },
    picture: { type: String },
    nutrition: {
        carbs: { type: Number },
        protein: { type: Number },
        fat: { type: Number },
        fiber: { type: Number }
    },
    userId: { 
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
}, { timestamps: true });

const Meal = mongoose.model('Meal', mealSchema);
module.exports = Meal;