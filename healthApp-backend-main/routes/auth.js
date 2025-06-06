/* eslint-disable @typescript-eslint/no-require-imports */
const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const { refreshToken } = require('../middleware/authentication');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const twilio = require('twilio');
const sendEmail = require('../utils/sendEmail'); // Utility to send emails

require('dotenv').config();

const router = express.Router();

const generateToken = ( id ) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "7d"} );

const generateRefreshToken = ( id ) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "14d"} );

/*
// twilio (phone otp)
const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)

router.post('/register-otp', async (req, res) => {
    const { phone, password } = req.body;

    try {
        if (!phone || !password) {
            return res.status(400).json({ message: "Phone number and password are required." });
        }

        const userExists = await User.findOne({ phone });

        if (userExists) {
            if (userExists.isVerified) {
                return res.status(400).json({ message: "User already exists and is verified, please login." });
            } else {
                // User exists but not verified, resend OTP
                const otp = generateOTP();
                userExists.otp = otp;
                userExists.otpExpires = new Date(Date.now() + 10 * 60 * 1000); // Expires in 10 minutes
                await userExists.save();

                try {
                    console.log(`Sending OTP ${otp} to ${phone}`); //Debugging log
                    await client.messages.create({
                        body: `Your OTP for HealthApp is ${otp}, it expires in 10 minutes.`,
                        from: process.env.TWILIO_PHONE_NUMBER,
                        to: phone,
                    });
                    console.log(`OTP sent to ${phone}: ${otp}`);
                    return res.json({ message: "OTP resent. Please verify your account." });
                } catch (twilioError) {
                    console.error("Twilio error:", twilioError);
                    return res.status(500).json({ message: "Failed to send OTP via Twilio." });
                }
            }
        }

        // New user registration
        const hashedPassword = await bcrypt.hash(password, 10);
        const otp = generateOTP();
        const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // Expires in 10 minutes

        const newUser = new User({
            phone,
            password: hashedPassword,
            otp,
            otpExpires,
            isVerified: false,
        });

        await newUser.save();

        try {
            console.log(`Sending OTP ${otp} to ${phone}`); //Debugging log
            await client.messages.create({
                body: `Your OTP for HealthApp is ${otp}, it expires in 10 minutes.`,
                from: process.env.TWILIO_PHONE_NUMBER,
                to: phone,
            });

            console.log(`OTP sent to ${phone}: ${otp}`);
            res.json({ message: "OTP sent! Please verify your account." });
        } catch (twilioError) {
            console.error("Twilio error:", twilioError);
            return res.status(500).json({ message: "Failed to send OTP via Twilio." });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Internal server error" });
    }
});

// Verify OTP
router.post('/verify-otp', async (req, res) => {
    const { phone, otp } = req.body;

    try {
        if (!phone || !otp) {
            return res.status(400).json({ message: "Phone and OTP are required." });
        }

        const user = await User.findOne({ phone });

        if (!user) {
            return res.status(404).json({ message: "User not found." });
        }

        if (user.otp !== otp) {
            return res.status(400).json({ message: 'Invalid OTP.' });
        }

        if (user.otpExpires < new Date()) {
            return res.status(400).json({ message: 'OTP has expired.' });
        }

        user.isVerified = true;
        user.otp = null;
        user.otpExpires = null;
        await user.save();

        res.json({ message: "OTP Verified, you can now continue signing up.", userId: user._id }); // Return user ID
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Internal server error" });
    }
});
*/

router.post('/register', async (req, res) => {
    const startTime = Date.now();
    const { username, password } = req.body;
  
    if (!username || !password) {
      return res.status(400).json({ message: "Username and password are required." });
    }
  
    // ✅ Password strength validation
    const passwordIsValid = password.length >= 6 && /[a-zA-Z]/.test(password) && /\d/.test(password);
    if (!passwordIsValid) {
      return res.status(400).json({
        message: "Password must be at least 6 characters long and include both letters and numbers.",
      });
    }
  
    const userExists = await User.findOne({ username });
    if (userExists) {
      return res.status(400).json({ message: "User already exists" });
    }
  
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ username, password: hashedPassword });
  
    try {
      await newUser.save();
      const endTime = Date.now();
      console.log(`User registration took ${endTime - startTime} ms`);
      res.status(201).json({
        message: "User registered successfully",
        user: { _id: newUser._id },
      });
    } catch (error) {
      console.error("Error registering user:", error);
      res.status(400).json({ message: "Error registering user" });
    }
  });


router.post('/login', async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ message: "Username and password are required." });
    }

    const user = await User.findOne({ username });

    if (!user) {
       return res.status(401).json({ message: "Invalid username or password." });
    }


    if (await bcrypt.compare(password, user.password)) {
        const token = generateToken(user._id);
        const refreshToken = generateRefreshToken(user._id);

        // Set tokens in cookies
        res.cookie("token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production' || false,
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        });

        res.cookie("refreshToken", refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production' || false,
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        });
        console.log(`User ${username} logged in successfully.`);
        res.status(200).json({ message: 'User logged in successfully', token, userId: user._id }); //Return user ID
    } else {
        res.status(401).json({ message: "Invalid username or password." });
    }
});

router.post('/token', async (req, res) => {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) {
        return res.status(401).json({ message: "No refresh token provided" });
    }

    try {
        const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);
        const newToken = generateToken(decoded.id);
        res.json({ token: newToken });
    } catch (error) {
        res.status(403).json({ message: "Invalid refresh token" });
    }
});

router.post('/logout', async (req, res) => {
    res.clearCookie('token', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production' || false,
        sameSite: 'strict',
    });
    res.clearCookie('refreshToken', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production' || false,
        sameSite: 'strict',
    });
    res.status(200).json({ message: 'Logged out successfully' });
    console.log('Logged out successfully.');
});

router.post('/refresh-token', refreshToken);


// POST /api/auth/forgot-password
router.post('/forgot-password', async (req, res) => {
    try {
      const { email } = req.body;
      const user = await User.findOne({ email });
      if (!user) return res.status(404).json({ message: 'User not found' });
  
      // Generate reset token
      const resetToken = crypto.randomBytes(32).toString('hex');
      const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');
  
      // Store the token hash in the database
      user.resetPasswordToken = resetTokenHash;
      user.resetPasswordExpire = Date.now() + 15 * 60 * 1000; // 15 minutes
      await user.save();
  
      // Send the reset link via email
      const resetUrl = `HealthApp/reset-password/${resetToken}`;
      await sendEmail(user.email, 'Reset Your Password', `Reset your password here: ${resetUrl}`);
  
      res.status(200).json({ message: 'Reset link sent to your email' });
    } catch (err) {
      res.status(500).json({ message: 'Server error', error: err.message });
    }
  });
  
  // POST /api/auth/reset-password/:resetToken
  router.post('/reset-password/:resetToken', async (req, res) => {
    try {
      const resetTokenHash = crypto.createHash('sha256').update(req.params.resetToken).digest('hex');
  
      // Find the user with the token and ensure it hasn't expired
      const user = await User.findOne({
        resetPasswordToken: resetTokenHash,
        resetPasswordExpire: { $gt: Date.now() },
      });
  
      if (!user) return res.status(400).json({ message: 'Invalid or expired token' });
  
      // Reset the user's password
      const { password } = req.body;
      user.password = await bcrypt.hash(password, 10); // Hash the new password
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save();
  
      res.status(200).json({ message: 'Password reset successful' });
    } catch (err) {
      res.status(500).json({ message: 'Server error', error: err.message });
    }
  });
  

module.exports = router;
