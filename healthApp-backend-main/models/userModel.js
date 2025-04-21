const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
   username: { type: String, unique: true, sparse: true },
   password: { type: String, required: true },
   avatar: { type: String },
   email: { type: String, unique: true, sparse: true },
   phone: { type: String, unique: true, sparse: true },
   fullName: { type: String },
   age: { type: Number},
   height: { type: Number },
   weight: { type: Number },
   bmi: { type:  Number },
   sex: { type: String },
   Address: { type: String },
   illness: { type: String },
   allergy: { type: String },
   foodPreference: { type: String },
   goal: { type: String },
   otp: { type: String },
   isVerified: { type: Boolean, default: false },
   isUser: { type: Boolean, default: true },
   isAdmin: { type: Boolean, default: false },
   isTrainer: { type: Boolean, default: false },
   trainerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }
});

const User = mongoose.model.User || mongoose.model('User', userSchema);
module.exports = User;