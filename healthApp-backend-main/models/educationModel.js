const mongoose = require('mongoose');

const educationSchema = new mongoose.Schema({
   title: { type: String, required: true },
   institute: { type: String, required: true },
   certificate: { type: String, required: false },
   gpa: { type: Number, required: false },
   coursework: { type: String, required: false },
   startDate: { type: String, required: true },
   endDate: { type: String, required: false },
});

const Education = mongoose.model('Education', educationSchema);
module.exports = Education;