const mongoose = require('mongoose');

const testimonialSchema = new mongoose.Schema({
   picture: { type: String, required: false },
   companyName: { type: String, required: false },
   clientName: { type: String, required: true },
   jobTitle: { type: String, required: false },
   message: { type: String, required: true },
}, {timestamps: true});

const Testimonial = mongoose.model('Testimonial', testimonialSchema);
module.exports = Testimonial;