const express = require('express');
const multer = require('multer');
const jwt = require('jsonwebtoken');
const path = require('path');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

const app = express();
app.use(express.json());
app.use(express.static('public'));

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    const isAudio = file.mimetype.includes('audio');
    return {
      folder: '8dax_uploads',
      resource_type: isAudio ? 'video' : 'image',
      public_id: file.fieldname
    };
  }
});

const upload = multer({ storage });

app.post('/api/login', (req, res) => {
  const { password } = req.body;
  if (password === process.env.ADMIN_PASSWORD) {
    const token = jwt.sign({ role: 'admin' }, process.env.JWT_SECRET, { expiresIn: '7d' });
    return res.json({ success: true, token });
  }
  res.status(401).json({ success: false, message: 'Mot de passe incorrect' });
});

const authenticateAdmin = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Non autorisé' });
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch (err) {
    res.status(403).json({ message: 'Token invalide' });
  }
};

app.post('/api/admin/upload', authenticateAdmin, upload.fields([{ name: 'avatar' }, { name: 'vocal' }]), (req, res) => {
  res.json({ success: true, message: 'Fichiers mis à jour !' });
});

app.get('/api/media', async (req, res) => {
  try {
    const avatar = cloudinary.url('8dax_uploads/avatar', { secure: true });
    const vocal = cloudinary.url('8dax_uploads/vocal', { resource_type: 'video', secure: true });
    
    res.json({
      avatarUrl: `${avatar}?t=${Date.now()}`,
      vocalUrl: `${vocal}?t=${Date.now()}`
    });
  } catch (err) {
    res.status(500).json({ error: 'Erreur lors de la récupération' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Serveur lancé sur le port ${PORT}`));
 
