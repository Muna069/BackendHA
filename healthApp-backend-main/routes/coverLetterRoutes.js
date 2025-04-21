const express = require('express');
const router = express.Router();
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();
const CoverLetter = require('../models/coverLetterModel');

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY);

router.post('/generate-cover-letter-auto', async (req, res) => {
    try {
        const { user, jobDetails } = req.body;

        const { name, email, phone, address, education, experience, skills, qualifications } = user;
        const { additionalInformation, companyName, companyAddress, jobTitle, jobDescription } = jobDetails;

        if (!name || !email || !phone || !education || !experience || !skills || !jobDescription) {
            return res.status(400).json({ error: "Missing required user or job details." });
        }

        const userDataForPrompt = {
            name,
            phone,
            email,
            address,
            education,
            experience,
            skills,
            qualifications, 
            additionalInformation,
        };

        const jobDetailsForPrompt = {
            companyName: companyName || "[Company Name]",
            companyAddress: companyAddress || "[Company Address]",
            jobTitle: jobTitle || "[Job Title]",
            jobDescription,
        };

        const prompt = generatePromptAuto(userDataForPrompt, jobDetailsForPrompt);

        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
        const result = await model.generateContent(prompt);
        const coverLetter = result.response.text();

        res.json({ coverLetter });

    } catch (error) {
        console.error("Error generating cover letter:", error);
        res.status(500).json({ error: "Failed to generate cover letter." });
    }
});

router.post('/generate-cover-letter-manual', async (req, res) => {
    try {
        const {
            yourName,
            yourAddress,
            yourPhoneNumber,
            yourEmail,
            yourQualifications,
            yourSkills,
            yourExperience,
            yourEducation,
            additionalInformation,
            companyName,
            companyAddress,
            jobTitle,
            jobDescription
        } = req.body;

        // **Crucial: Input Validation**
        if (!yourName || !yourAddress || !yourEmail || !yourQualifications || !yourSkills || !yourExperience || !yourEducation || !jobDescription) {
            return res.status(400).json({ error: 'Missing required fields.' });
        }

        const prompt = generatePrompt(
            yourName,
            yourAddress,
            yourPhoneNumber,
            yourEmail,
            yourQualifications,
            yourSkills,
            yourExperience,
            yourEducation,
            additionalInformation,
            companyName,
            companyAddress,
            jobTitle,
            jobDescription
        );

        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
        const result = await model.generateContent(prompt);

        const responseText = result.response.text();

        res.json({ coverLetter: responseText });
    } catch (error) {
        console.error('Error generating cover letter:', error);
        res.status(500).json({ error: 'Failed to generate cover letter' });
    }
});

function generatePromptAuto(userData, jobDetails) {
    const today = new Date().toLocaleDateString('en-US', {
        year: 'numeric', month: 'long', day: 'numeric',
    });

    return `
    You are an expert cover letter writer with a knack for crafting personalized and engaging letters that sound genuinely human. Your task is to write a compelling and professional cover letter, formatted as valid HTML, based on the following information. If any information is missing, and the Job Description provides it, use the Job Description as a primary source of truth.

    Date: ${today}

    Applicant Information:
    Name: ${userData.name}
    Phone: ${userData.phone}
    Email: ${userData.email}
    Address: ${userData.address}
    Qualifications: ${userData.qualifications}
    Education: ${userData.education}
    Experience: ${userData.experience}
    Skills: ${userData.skills}
    Additional Information: ${userData.additionalInformation}

    Job Details:
    Company Name: ${jobDetails.companyName}
    Company Address: ${jobDetails.companyAddress}
    Job Title: ${jobDetails.jobTitle}
    Job Description: ${jobDetails.jobDescription}    

     [Instructions and Formatting]
    1. Begin with today's date, formatted as "${today}", aligned to the left.
    2. Follow with your name, phone number, and email, formatted as a block, with a line break after each item.
    3. If the Company Name and Company Address are known (i.e. are *not* "to be extracted from the job description" then include "Hiring Manager" on a line by itself, followed by the Company Name and Company Address, each on a new line. Omit this section if the Company Name and Company Address are unknown.
    4. Address the cover letter to the Hiring Manager (or "Hiring Team" if a specific name isn't available). Use a professional and welcoming tone.
    5. Craft a compelling introduction that immediately grabs the reader's attention. Mention the specific job title and express enthusiasm for the opportunity. If the Job Title was not explicitly specified, then be certain to extract it from the Job Description.
    6. In the body paragraphs, highlight 2-3 key skills and experiences that align with the job description. Use specific examples to demonstrate accomplishments and quantify results where possible. Include any additional information as needed. Focus on how you can contribute to ${jobDetails.companyName}'s success. If the company name is not explicitly specified, then be certain to extract it from the Job Description.
    7. Conclude with a strong closing paragraph that reiterates interest, summarizes key qualifications, and expresses eagerness to learn more in an interview.
    8. End with a professional closing like "Sincerely," followed by a line break and your full name, "${userData.name}".
    9.  If not presented explicitly, get company name, company address, job title from the ${jobDetails.jobDescription}.
    10. You can omit including information such as company address etc.. if not presented.
    11. Strict to writing the cover letter with the details that match the job description only. Don't write and use unrelated information.
    12. The cover letter should have less than 1000 words.

    [HTML Formatting Requirements]
    * Use <p> for paragraphs. Ensure each paragraph is concise and focused.
    * Use <h1> or <h2> for headings (optional).
    * Use <ul> and <li> for listing skills if applicable.
    * Use <br> for line breaks between paragraphs and within address/contact blocks. Ensure proper spacing between paragraphs.
    * Apply inline CSS sparingly (e.g., <p style="font-family: Arial, sans-serif; font-size: 12pt;">). Avoid complex CSS.
    * Use appropriate HTML structure (paragraphs, line breaks) for proper indentation and spacing.
    * Do not include full HTML document structure (e.g., <html>, <head>, <body>).
    * Do not add introductory or closing phrases (e.g., "Here is the cover letter").
    * Add a line break between the company address and "Dear Hiring Manager."
    * Do not mention "as advertised on..." unless it is explicitly mentioned in the job description or additional information.
    
    [Tone and Style]
    * Write in a confident, enthusiastic, and professional tone.
    * Tailor the content more directly to the job, especially by extracting key requirements from the Job Description.
    * Include a stronger opening and closing.
    * Mention key technologies where appropriate to make the application stand out.
    * Use clear, concise language and avoid jargon.
    * Focus on the benefits you can bring to ${jobDetails.companyName}, or to what you know about the company from the Job Description if the Company Name was not explicitly provided.
    * Make the letter sound like a real person wrote it—avoid overly formal or robotic language.

    Limit the cover letter to a maximum of 4 paragraphs.
    `;
}

function generatePrompt(
    yourName,
    yourAddress,
    yourPhoneNumber,
    yourEmail,
    yourQualifications,
    yourSkills,
    yourExperience,
    yourEducation,
    additionalInformation,
    companyName,
    companyAddress,
    jobTitle,
    jobDescription
) {
    const today = new Date();
    const formattedDate = today.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    return `You are an expert cover letter writer with a knack for crafting personalized and engaging letters that sound genuinely human. Write a compelling and professional cover letter based on the following information.  The output should be valid HTML:

    [Applicant Information]
    Your Name: ${yourName}
    Your Address: ${yourAddress}
    Your Phone Number: ${yourPhoneNumber}
    Your Email: ${yourEmail}
    Additional Information: ${additionalInformation}

    [Qualifications Summary]
    Your Qualifications: ${yourQualifications}
    Your Skills: ${yourSkills}
    Your Experience: ${yourExperience}
    Your Education: ${yourEducation}

    [Company & Job Information]
    Company Name: ${companyName}
    Company Address: ${companyAddress}
    Job Title: ${jobTitle}
    Job Description: ${jobDescription}

    [Instructions and Formatting]
    1.  Begin with today's date, formatted as "${formattedDate}", aligned to the left.
    2.  Follow with the ${yourName}, ${yourAddress}, ${yourPhoneNumber} and ${yourEmail}, formatted as a block, add a line break.
    3.  Add "Hiring Manager" and add ${companyName} and ${companyAddress}. 
    4.  Address the cover letter to the Hiring Manager (or "Hiring Team" if a specific name isn't available).  Use a professional and welcoming tone.
    4.  Craft a compelling introduction that immediately grabs the reader's attention.  Mention the specific job title and express your enthusiasm for the opportunity.
    5.  In the body paragraphs, highlight 2-3 key skills and experiences that directly align with the Job Description.  Use specific examples to demonstrate your accomplishments and quantify your results whenever possible. Add ${additionalInformation} if the job description requires. Focus on how you can contribute to ${companyName}'s success.
    6.  Conclude with a strong closing paragraph that reiterates your interest, summarizes your key qualifications, and expresses your eagerness to learn more in an interview.
    7.  End with a professional closing like "Sincerely," preceded and followed by a line break and your full name, "${yourName}".
    8.  If not presented explicitly, get company name, company address, job title from the ${jobDescription}.
    9.  The cover letter should have less than 1000 words.

    [HTML Formatting Requirements]
    *   Use the following HTML tags to structure the cover letter:
        *   <p> for paragraphs.  Ensure each paragraph is concise and focused.
        *   <h1> or <h2> for a heading (optional, use sparingly if at all).
        *   <ul> and <li> for listing skills (if appropriate).
        *   <br> for line breaks where needed such as between paragraphs.
    *   Use inline CSS sparingly for very basic styling (e.g., <p style="font-family: Arial, sans-serif; font-size: 12pt;">).  Avoid complex CSS.
    *   Ensure proper indentation and spacing by using appropriate HTML structure (paragraphs, line breaks).
    *   Add line break after every paragraph.
    *   Do NOT include a full HTML document structure (<html>, <head>, <body> tags).  Only provide the content of the cover letter.
    *   Do NOT include any introductory phrases like "Here is the cover letter" or closing phrases like "End of cover letter."
    *   Put a line break between ${companyAddress} and "Dear Hiring Manager".
    *   Don't say "as advertised on..." unless it is mentioned explicitly in the ${additionalInformation} or job description. 

    [Tone and Style]
    *   Write in a confident, enthusiastic, and professional tone.
    *   Match the job more directly.
    *   Stronger opening & closing.
    *   Mention key technologies to make the application stand out.
    *   Use clear, concise language and avoid jargon.
    *   Focus on the benefits you can bring to ${companyName}.
    *   Make it sound like a real person wrote it - avoid overly formal or robotic language.

    Limit the cover letter to a maximum of 4 paragraphs.`;
}

router.post('/save', async (req, res) => {
    const { title, content } = req.body;

    if (!title || !content) {
        return res.status(400).json({ success: false, message: "Title and content are required." });
    }

    try {
        const newCoverLetter = new CoverLetter({
            title,
            content,
        });

        await newCoverLetter.save();
        res.status(200).json({ success: true, message: "Cover letter saved successfully." });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Failed to save cover letter." });
    }
});

router.get('/', async (req, res) => {
    try {
        const coverLetters = await CoverLetter.find().sort({ createdAt: -1 });
        res.status(200).json(coverLetters);
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Failed to fetch cover letters." });
    }
});

router.get('/:id', async (req, res) => {
    try {
        const coverLetter = await CoverLetter.findById(req.params.id);
        if (!coverLetter) {
            return res.status(404).json({ success: false, message: "Cover letter not found." });
        }
        res.status(200).json(coverLetter);
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Failed to fetch cover letter." });
    }
});

router.put('/:id', async (req, res) => {
    const { title, content } = req.body;

    if (!title || !content) {
        return res.status(400).json({ success: false, message: "Title and content are required." });
    }

    try {
        const updatedCoverLetter = await CoverLetter.findByIdAndUpdate(
            req.params.id,
            { title, content },
            { new: true, runValidators: true }
        );

        if (!updatedCoverLetter) {
            return res.status(404).json({ success: false, message: "Cover letter not found." });
        }

        res.status(200).json({ success: true, message: "Cover letter updated successfully.", updatedCoverLetter });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Failed to update cover letter." });
    }
});

router.delete('/:id', async (req, res) => {
    try {
        const deletedCoverLetter = await CoverLetter.findByIdAndDelete(req.params.id);

        if (!deletedCoverLetter) {
            return res.status(404).json({ success: false, message: "Cover letter not found." });
        }

        res.status(200).json({ success: true, message: "Cover letter deleted successfully." });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Failed to delete cover letter." });
    }
});


module.exports = router;