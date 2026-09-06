const express = require('express');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Cloudinary Configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Storage setup for Multer & Cloudinary
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    if (file.fieldname === 'profilePic') {
      return {
        folder: '8dax_uploads',
        resource_type: 'image'
      };
    } else {
      return {
        folder: '8dax_uploads',
        resource_type: 'auto'
      };
    }
  },
});

const upload = multer({ storage: storage });

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// In-memory store for URLs
let mediaUrls = {
  profilePic: '',
  voiceNote: ''
};

// Upload Route
app.post('/api/upload', upload.fields([
  { name: 'profilePic', maxCount: 1 },
  { name: 'voiceNote', maxCount: 1 }
]), (req, res) => {
  try {
    if (req.files && req.files.profilePic) {
      mediaUrls.profilePic = req.files.profilePic[0].path;
    }
    if (req.files && req.files.voiceNote) {
      mediaUrls.voiceNote = req.files.voiceNote[0].path;
    }
    res.json({ 
      success: true, 
      profilePic: mediaUrls.profilePic, 
      voiceNote: mediaUrls.voiceNote 
    });
  } catch (error) {
    console.error('Upload Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Fetch Media Route
app.get('/api/media', (req, res) => {
  res.json(mediaUrls);
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
