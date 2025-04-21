const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const createStorage = (folder, allowedFormats, resourceType = 'image') => {
  return new CloudinaryStorage({
    cloudinary: cloudinary,
    params: (req, file) => ({
      folder: folder,
      allowed_formats: allowedFormats,
      resource_type: resourceType,
      public_id: `${Date.now()}-${file.originalname.split('.')[0]}`,
    }),
  });
};

// Avatar Storage
const avatarStorage = createStorage('healthApp/avatars', ['jpg', 'jpeg', 'png']);

// Exercise Storage
const exerciseStorage = createStorage('healthApp/exercise', ['jpg', 'jpeg', 'png', 'gif']);

// Meal Storage
const mealStorage = createStorage('healthApp/meal', ['jpg', 'jpeg', 'png']);

// Configure Multer uploads with limits
const uploadAvatar = multer({
  storage: avatarStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
});

const uploadExercise = multer({
  storage: exerciseStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
});

const uploadMeal = multer({
  storage: mealStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
});


module.exports = { uploadAvatar, uploadExercise, uploadMeal };