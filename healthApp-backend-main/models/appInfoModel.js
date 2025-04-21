const mongoose = require("mongoose")

const AppInfoSchema = new mongoose.Schema({
    privacyPolicy: {
        type: String,
    },
    faq: [
        {
            question: { type: String, required: true },
            answer: { type: String, required: true },
        },
    ],
    about: {
        description: {
            type: String
        },
        version: {
            type: String
        },
    },
})

const AppInfo = mongoose.model("AppInfo", AppInfoSchema)
module.exports = AppInfo