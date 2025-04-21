const express = require('express');
const bcrypt = require('bcrypt');
const User = require('../models/userModel');
const { authenticateToken, refreshToken }  = require('../middleware/authentication');
const { uploadAvatar } = require('../config/multerConfig'); 
const path = require('path');
const mongoose = require('mongoose');

const router = express.Router();

router.post('/setup', uploadAvatar.single('avatar'), async (req, res) => {
    const { _id, fullName, age, height, weight, sex, address, goal, illness, allergy, foodPreference } = req.body;

    // Validate required fields *before* querying the database
    if (!_id) {
        return res.status(400).json({ message: "User ID (_id) is required." });
    }

    try {
        // Check if the user exists *first*
        const user = await User.findById(_id);

        if (!user) {
            return res.status(404).json({ message: "User not found." }); // Use 404 for "not found"
        }

        user.fullName = fullName;
        user.age = age;
        user.height = height;
        user.weight = weight;
        user.sex = sex;
        user.Address = address;
        user.goal = goal;
        user.illness = illness;
        user.allergy = allergy;
        user.foodPreference = foodPreference;

        // Handle avatar upload
        if (req.file) {
            user.avatar = req.file.path;  // Or req.file.secure_url depending on your Cloudinary setup
        }

        // Calculate BMI only if height and weight are provided
        if (height && weight) {
            const heightInMeters = height / 100;
            user.bmi = (weight / (heightInMeters * heightInMeters)).toFixed(2);
        } else {
            user.bmi = null;  // Or handle the case where BMI cannot be calculated (e.g., set to null)
        }

        await user.save();

        // Return the updated user object (without sensitive information like password)
        const userResponse = {
            _id: user._id,
            username: user.username,
            fullName: user.fullName,
            age: user.age,
            height: user.height,
            weight: user.weight,
            bmi: user.bmi,
            sex: user.sex,
            Address: user.Address,
            goal: user.goal,
            illness: user.illness,
            allergy: user.allergy,
            foodPreference: user.foodPreference,
            avatar: user.avatar,
            isVerified: user.isVerified
        };

        res.json({ message: "Account setup complete.", user: userResponse });

    } catch (err) {
        console.error("Setup error:", err);  // Log the error
        res.status(500).json({ error: "Internal server error" });
    }
});


router.get('/', async (req, res) => {
    const startTime = Date.now();
    try {
        const users = await User.find();
        const endTime = Date.now();
        console.log(`Fetched ${users.length} users in ${endTime - startTime} ms`);
        res.status(200).json(users);
    } catch (error) {
        console.error("Error fetching users:", error.message);
        res.status(500).send("Error fetching users: " + error.message);
    }
});

router.delete('/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const user = await User.findById(id);
        if (user) {
            await User.deleteOne({ _id: id });
            res.send("User removed successfully");
        } else {
            res.status(404).send("User not found");
        }
    } catch (error) {
        console.error("Error removing user:", error.message);
        res.status(500).send("Error removing user: " + error.message);
    }
});


router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        let user = null;

        if (mongoose.Types.ObjectId.isValid(id)) {
            user = await User.findById(id);
        }

        if (!user) {
            user = await User.findOne({ username: id });
        }

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.status(200).json(user);
    } catch (error) {
        console.error('Error fetching user:', error.message);
        res.status(500).json({ error: 'Server error' });
    }
});

router.put('/update-profile', uploadAvatar.single('avatar'), async (req, res) => {
    const { _id, username, fullName, age, height, weight, sex, address, goal, illness, allergy, foodPreference, email, phone, password } = req.body;
    
    if (!_id) {
        return res.status(400).json({ message: "User ID is required."});
    }

    try {
        const user = await User.findById(_id);
        if (!user) return res.status(400).json({ message: "User not found."});

        if ( username && username !== user.username) {
            const usernameExists = await User.findOne({ username, _id: { $ne: _id }});
            if (usernameExists) {
                return res.status(400).json({ message: "Username already exists, choose another."});
            }
            user.username = username;
        }

        if ( email && email !== user.email ){
            const emailExists = await User.findOne({ email, _id: { $ne: _id }});
            if (emailExists) {
                return res.status(400).json({ message: "Email already in use."});
            }
            user.email = email;
        }

        if (phone && phone !== user.phone) {
            const phoneExists = await User.findOne({ phone, _id: { $ne: _id }});
            if (phoneExists) {
                return res.status(400).json({ message: "Phone number already in use."});
            }
            user.phone = phone;
        }

        if (password) {
            user.password = await bcrypt.hash(password, 10);
        }

        user.fullName = fullName || user.fullName;
        user.age = age || user.age;
        user.height = height || user.height;
        user.weight = weight || user.weight;
        user.sex = sex || user.sex;
        user.Address = address || user.address;
        user.goal = goal || user.goal;
        user.illness = illness || user.illness;
        user.allergy = allergy || user.allergy;
        user.foodPreference = foodPreference || user.foodPreference;

        // Handle avatar upload
        if (req.file) {
            user.avatar = req.file.path;  // Or req.file.secure_url depending on your Cloudinary setup
        }

        if (height && weight) {
            const heightInMeters = height / 100;
            user.bmi = parseFloat((weight / (heightInMeters ** 2)).toFixed(2));
        }

        await user.save();
        res.json({ message: "Profile updated successfully.", user});
    } catch (err) {
        console.error("Update profile error:", err);
        res.status(500).json({ error: err.message });
    }
});


router.post("/create-trainer", async (req, res) => {
    const { userId, username, password } = req.body;

    try {
        // Check if the requester is an admin
        const adminUser = await User.findById(userId);
        if (!adminUser || !adminUser.isAdmin) {
            return res.status(403).json({ message: "Unauthorized" });
        }

        // Check if the username already exists
        const userExists = await User.findOne({ username });
        if (userExists) {
            return res.status(400).json({ message: "Username already exists." });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newTrainer = new User({
            username,
            password: hashedPassword,
            isAdmin: false, 
            isUser: true,
            isTrainer: true,  
            isVerified: true
        });

        await newTrainer.save();

        res.status(201).json({ message: "Trainer created successfully", user: newTrainer });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post("/create-admin", async (req, res) => {
    const { userId, username, password } = req.body;

    try {
        // Check if the requester is an admin
        const adminUser = await User.findById(userId);
        if (!adminUser || !adminUser.isAdmin) {
            return res.status(403).json({ message: "Unauthorized" });
        }

        // Check if the username already exists
        const userExists = await User.findOne({ username });
        if (userExists) {
            return res.status(400).json({ message: "Username already exists." });
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create new admin user
        const newAdmin = new User({
            username,
            password: hashedPassword,
            isAdmin: true,
            isUser: true,
            isTrainer: false,
            isVerified: true
        });

        await newAdmin.save();

        res.status(201).json({ message: "Admin created successfully", user: newAdmin });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.put('/update-role/:id', async (req, res) => {
    const { isTrainer, isAdmin } = req.body
    const userId = req.params.id
    try {
        const adminUser = await User.findById(req.user.id)
        if (!adminUser || !adminUser.isAdmin) {
            return res.status(403).json({ message: "Unauthorized!"})
        }

        const user = await User.findById(userId)
        if (!user) return res.status(404).json({ message: "User not found."})

        if (isTrainer !== undefined) {
            user.isTrainer = isTrainer
            if (isTrainer) user.isAdmin = false
        }
        
        if (isAdmin !== undefined) {
            user.isAdmin = isAdmin
            if (isAdmin) user.isTrainer = false
        }

        await user.save()
        res.json({ message: "User role updated successfully", user})
    } catch (err) {
        res.status(500).json({ error: err.message })
    }
})

router.get('/trainer', async (req, res) => {
    try {
        const trainers = await User.find({ isTrainer: true }).select('-password')
        res.json(trainers)
    } catch (err) {
        res.status(500).json({ error: err.message })
    }
})

router.get('/users', async (req, res) => {
    try {
        const users = await User.find({ isUser: true }).select('-password');

        if (users.length === 0) {
            return res.status(404).json({ message: 'No users found' });
        }

        res.json(users);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get('/trainer-users/:trainerId', async (req, res) => {
    try {
        const users = await User.find({ trainerId: req.params.trainerId }).select('-password')
        res.json(users)
    } catch (err) {
        res.status(500).json({error: err.message})
    }
})

router.get('/user-trainer/:userId', async (req, res) => {
    try {
    const user = await User.findById(req.params.userId).populate('trainerId', '-password')

    if (!user || !user.trainerId) {
        return res.status(404).json({ message: "No trainer assigned"})
    }
    res.json(user.trainerId)
    } catch (err) {
        res.status(500).json({error: err.message})
    }
}) 

router.put('/change-trainer/:userId', async (req, res) => {
    try {
        const { trainerId } = req.body;

        if (!trainerId) {
            return res.status(400).json({ message: "Trainer ID is required" });
        }

        const trainer = await User.findById(trainerId);
        if (!trainer || !trainer.isTrainer) {
            return res.status(404).json({ message: "Invalid trainer ID" });
        }

        const user = await User.findByIdAndUpdate(req.params.userId, { trainerId }, { new: true }).populate('trainerId', '-password');

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        res.json({ message: "Trainer updated successfully", trainer: user.trainerId });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get('/users/count', async (req, res) => {
    try {
        const userCount = await User.countDocuments({ isUser: true });
        res.json({ count: userCount });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get('/trainers/count', async (req, res) => {
    try {
        const trainerCount = await User.countDocuments({ isTrainer: true });
        res.json({ count: trainerCount });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get('/admins/count', async (req, res) => {
    try {
        const adminCount = await User.countDocuments({ isAdmin: true });
        res.json({ count: adminCount });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/assign-trainer', async (req, res) => {
    const { userId, trainerId } = req.body;

    if (!mongoose.Types.ObjectId.isValid(userId) || !mongoose.Types.ObjectId.isValid(trainerId)) {
        return res.status(400).json({ message: "Invalid userId or trainerId format." });
    }

    try {
        const user = await User.findById(userId);
        const trainer = await User.findById(trainerId);

        if (!user || !trainer) {
            return res.status(400).json({ message: "User or Trainer not found" });
        }

        if (!trainer.isTrainer) {
            return res.status(400).json({ message: "Selected user is not a trainer" });
        }

        user.trainerId = trainerId;
        await user.save();

        res.json({ message: "Trainer assigned successfully." });
    } catch (err) {
        console.error("Error assigning trainer:", err);
        res.status(500).json({ error: err.message });
    }
});

router.get('/:userId/trainer', async (req, res) => {
    const { userId } = req.params;
  
    try {
      const user = await User.findById(userId).populate('trainerId');
      if (!user || !user.trainerId) {
        return res.status(404).json({ message: 'No trainer assigned to this user' });
      }
  
      res.json(user.trainerId);
    } catch (err) {
      console.error('Error fetching trainer:', err.message);
      res.status(500).json({ message: 'Error fetching trainer' });
    }
  })  

  router.get('/trainers/:trainerId/users', async (req, res) => {
    try {
        const { trainerId } = req.params;
        if (!trainerId.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({ error: "Invalid trainerId format." });
        }
        const users = await User.find({ trainerId });

        res.json(users);
    } catch (error) {
        console.error("Error fetching users assigned to trainer:", error);
        res.status(500).json({ error: "Server error" });
    }
});

router.get('/trainers/:trainerId/users/count', async (req, res) => {
    try {
        const { trainerId } = req.params;

        // Validate trainerId format
        if (!trainerId.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({ error: "Invalid trainerId format." });
        }

        // Count the users assigned to the trainer
        const userCount = await User.countDocuments({ trainerId });

        res.json({ count: userCount });
    } catch (error) {
        console.error("Error fetching user count for trainer:", error);
        res.status(500).json({ error: "Server error" });
    }
});

module.exports = router;