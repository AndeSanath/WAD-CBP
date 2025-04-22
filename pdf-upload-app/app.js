const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();

// Configuration
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));

// Multer setup for PDF uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, 'public', 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed!'));
    }
  },
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Routes
app.get('/', (req, res) => {
  const uploadDir = path.join(__dirname, 'public', 'uploads');
  let pdfFiles = [];
  
  if (fs.existsSync(uploadDir)) {
    pdfFiles = fs.readdirSync(uploadDir)
      .filter(file => path.extname(file).toLowerCase() === '.pdf')
      .map(file => ({
        name: file,
        path: `/uploads/${file}`
      }));
  }
  
  res.render('index', { pdfFiles });
});

app.post('/upload', upload.single('pdfFile'), (req, res) => {
  res.redirect('/');
});

// Error handling
app.use((err, req, res, next) => {
  res.status(500).send(err.message);
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});