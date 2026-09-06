const express = require('express');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Configuration Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Stockage Cloudinary sans restriction de format
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

// Stockage temporaire des URLs
let mediaUrls = {
  profilePic: '',
  voiceNote: ''
};

// Route d'upload pour l'administration
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
    res.json({ success: true, mediaUrls });
  } catch (error) {
    console.error('Erreur Upload:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Route pour récupérer les médias sur la page d'accueil
app.get('/api/media', (req, res) => {
  res.json(mediaUrls);
});

app.listen(PORT, () => {
  console.log(`Serveur démarré sur le port ${PORT}`);
});
