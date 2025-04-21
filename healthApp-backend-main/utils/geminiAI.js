const axios = require("axios");

const generateGeminiAIResponse = async (prompt) => {
    try {
        const response = await axios.post(
            "https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateText",
            { prompt },
            { headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.GEMINI_API_KEY}` } }
        );

        return response.data.candidates[0]?.output || null;
    } catch (error) {
        console.error("Gemini AI Error:", error.message);
        return null;
    }
};

module.exports = { generateGeminiAIResponse };
