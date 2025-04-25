/* eslint-disable @typescript-eslint/no-require-imports */
const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const { refreshToken } = require('../middleware/authentication');
const validator = require('validator');
require('dotenv').config();

const router = express.Router();

const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });

const generateRefreshToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '14d' });

// Register

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

// Login
router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: 'Username and password are required.' });
  }

  const user = await User.findOne({ username });

  if (!user) {
    return res.status(401).json({ message: 'Invalid username or password.' });
  }

  if (await bcrypt.compare(password, user.password)) {
    const token = generateToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production' || false,
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    });

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production' || false,
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    });

    console.log(`User ${username} logged in successfully.`);
    res.status(200).json({
      message: 'User logged in successfully',
      token,
      userId: user._id,
    });
  } else {
    res.status(401).json({ message: 'Invalid username or password.' });
  }
});

// Refresh token
router.post('/token', async (req, res) => {
  const refreshToken = req.cookies.refreshToken;
  if (!refreshToken) {
    return res.status(401).json({ message: 'No refresh token provided' });
  }

  try {
    const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);
    const newToken = generateToken(decoded.id);
    res.json({ token: newToken });
  } catch (error) {
    res.status(403).json({ message: 'Invalid refresh token' });
  }
});

// Logout
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

// Refresh token route using middleware
router.post('/refresh-token', refreshToken);

module.exports = router;
