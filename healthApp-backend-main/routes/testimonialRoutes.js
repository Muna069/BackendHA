const express = require('express');
const Testimonial = require('../models/testimonialModel');
const { uploadTestimonial }= require('../config/multerConfig');
const { authenticateToken, refreshToken }  = require('../middleware/authentication');

const path = require('path');

const router = express.Router();

router.post('/add', uploadTestimonial.single('picture'), async (req, res) => {
    console.log("received body:", req.body)
    const startTime = Date.now(); // Start time for logging
    const { companyName, clientName, jobTitle, message } = req.body;

   if (!clientName || !message ) {
    return res.status(400).send("Client Name and message are required.");
    }

    //const picture = req.file ? `/uploads/testimonials/${req.file.filename}` : null
    const picture = req.file ? req.file.path : null;

    const newTestimonial = new Testimonial({ picture, companyName, clientName, jobTitle, message });

   try {
       await newTestimonial.save();
       const endTime = Date.now(); // End time for logging
       console.log(`Testimonial addition took ${endTime - startTime}ms`);
       res.status(200).send("Testimonial added successfully");
   } catch (error) {
        console.error("Error adding testimonial:", error.message || error);
       res.status(400).send("Error occured while adding testimonial");      
   }
});

router.get('/', async (req, res) => {
    const startTime = Date.now(); 

    try {
        const testimonials = await Testimonial.find().sort({ createdAt: -1 }); 
        const endTime = Date.now(); 
        console.log(`Fetched ${testimonials.length} testimonials in ${endTime - startTime}ms`);
        if (!testimonials) {
            return res.status(404).send('testimonials can not be found');
        }
        res.status(200).json(testimonials); 
    } catch (error) {
        console.error("Error fetching testimonials:", error.message);
        res.status(500).send("Error fetching testimonials: " + error.message);
    }
});

router.get('/:id', async (req, res) => {
    const startTime = Date.now(); 
    const { id } = req.params; 

    try {
        const testimonial = await Testimonial.findById(id);
        const endTime = Date.now(); 
        console.log(`Fetched a testimonial in ${endTime - startTime}ms`);
        if (!testimonial) {
            return res.status(404).send('Testimonial not found');
        }
        res.status(200).json(testimonial);
    } catch (error) {
        console.error("Error fetching testimonial:", error.message);
        res.status(500).send("Server error");
    }
});

router.delete('/:id', authenticateToken, async (req, res) => {
    const startTime = Date.now(); 
    const { id } = req.params; 

    try {
        const testimonial = await Testimonial.findById(id); 
        if (testimonial) { 
            await Testimonial.deleteOne({ _id: id });
            const endTime = Date.now(); 
            console.log(`Deleted an testimonial in ${endTime - startTime}ms`);
            res.send("Testimonial removed successfully");
        } else {
            res.status(404).send("Testimonial not found");
        }
    } catch (error) {
        console.error("Error removing testimonial:", error.message);
        res.status(500).send("Error removing testimonial: " + error.message);
    }
});


router.put('/:id', authenticateToken, uploadTestimonial.single('picture'), async (req, res) => {
    
    const { id } = req.params;
    const { companyName, clientName, jobTitle, message } = req.body; 
    const startTime = Date.now(); 

    try {
        const testimonial = await Testimonial.findById(id);

        if (!testimonial) {
            return res.status(404).send('Testimonial not found');
        }

        testimonial.companyName = companyName || testimonial.compnayName
        testimonial.clientName = clientName || testimonial.clientName
        testimonial.jobTitle = jobTitle || testimonial.jobTitle
        testimonial.message = message || testimonial.message
        
        /*if (req.file) {
            testimonial.picture = `/uploads/testimonials/${req.file.filename}`
        }*/
            if (req.file) {
                testimonial.picture = req.file.path; // Changed
            }

        await testimonial.save();
        const endTime = Date.now(); 
        console.log(`Updated an testimonial in ${endTime - startTime}ms`);

        res.status(200).send('Testimonial updated successfully');
    } catch (error) {
        console.error('Error updating testimonial:', error.message);
        res.status(500).send('Error updating testimonial: ' + error.message);
    }
});

module.exports = router;