const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();

// Middleware
app.use(express.urlencoded({ extended: true })); // Required for form data
app.use(express.json());
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));

// Multer Configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, 'public', 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + path.extname(file.originalname));
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
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB
});

// Routes
app.get('/', (req, res) => {
  const uploadDir = path.join(__dirname, 'public', 'uploads');
  let pdfFiles = [];
  
  if (fs.existsSync(uploadDir)) {
    pdfFiles = fs.readdirSync(uploadDir)
      .filter(file => path.extname(file).toLowerCase() === '.pdf')
      .map(file => {
        const stat = fs.statSync(path.join(uploadDir, file));
        return {
          name: file,
          path: `/uploads/${file}`,
          uploadDate: stat.birthtime.toLocaleDateString(),
          size: (stat.size / 1024).toFixed(2) + ' KB'
        };
      })
      .sort((a, b) => fs.statSync(path.join(uploadDir, b.name)).birthtime - 
                      fs.statSync(path.join(uploadDir, a.name)).birthtime);
  }
  
  res.render('index', { pdfFiles });
});

app.post('/upload', upload.single('pdfFile'), (req, res) => {
  res.redirect('/');
});

app.post('/delete', (req, res) => {
  const filename = req.body.filename;
  if (!filename) return res.status(400).send('Filename required');

  // Security check
  if (filename.includes('..') || filename.includes('/')) {
    return res.status(400).send('Invalid filename');
  }

  const filePath = path.join(__dirname, 'public', 'uploads', filename);
  
  fs.unlink(filePath, (err) => {
    if (err) {
      console.error('Delete error:', err);
      return res.status(500).send('Error deleting file');
    }
    res.redirect('/');
  });
});

// Error Handling
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).send(err.message);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});