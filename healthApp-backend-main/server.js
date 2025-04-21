const express = require('express');
const mongoose = require('mongoose');
const connectDB = require('./config/db');
const cookieParser = require('cookie-parser');
const cors = require('cors')
const path = require('path');

require('dotenv').config();
connectDB();

const app = express();

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/userRoutes');

const appInfoRoutes = require('./routes/appInfoRoutes');
const dailyInsightRoutes = require('./routes/dailyInsightRoutes');
const exerciseRoutes = require('./routes/exerciseRoutes');
const mealRoutes = require('./routes/mealRoutes');
const mockDeviceRoutes = require('./routes/mockDeviceRoutes')
const notificationRoutes = require('./routes/notificationRoutes');

app.use(express.json());
app.use(cookieParser());

const corsOptions = {
  origin: true, 
  credentials: true, 
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  optionsSuccessStatus: 204, 
};

app.use(cors(corsOptions));

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);

app.use('/api/appInfo', appInfoRoutes);
app.use('/api/dailyInsight', dailyInsightRoutes);
app.use('/api/exercise', exerciseRoutes);
app.use('/api/meal', mealRoutes);
app.use('/api/device', mockDeviceRoutes);
app.use('/api/notification', notificationRoutes);

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

module.exports = app;