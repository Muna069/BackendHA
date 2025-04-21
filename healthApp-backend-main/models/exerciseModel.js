const mongoose = require("mongoose");

const ExerciseSchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true },
    description: { type: String, required: false },
    reps: { type: Number, required: false },
    time: { type: Number, required: false },
    thumbnail: { type: String, required: false },
    workoutGif: { type: String, required: false },
    lastCompleted: { type: Date, default: null },
    assignedTo: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    assignedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    assignedByType: { type: String, enum: ["ai", "trainer"], required: false },
    expiresAt: { type: Date, required: false },
}, { timestamps: true });

module.exports = mongoose.model("Exercise", ExerciseSchema);