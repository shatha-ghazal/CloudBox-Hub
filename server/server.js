const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
app.use(cors());
app.use(express.json());

// Create target destination bucket if missing
const UPLOAD_DIR = path.join(__dirname, 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR);
}

// Statically expose uploaded files to render dynamic download pipelines
app.use('/uploads', express.static(UPLOAD_DIR));

// Memory matrices data store (Resets when server script restarts)
const globalUsersList = [];
const personalStorageMap = {}; 

// Local system upload handler configuration
const diskStorageConfig = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const uploadProcessor = multer({ storage: diskStorageConfig });

/* --- AUTH ROUTES --- */

// Account Creation Endpoint
app.post('/api/auth/signup', (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ error: "Please populate all matching payload attributes." });
  }

  const identityMatch = globalUsersList.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (identityMatch) {
    return res.status(400).json({ error: "An account with this email profile identifier already exists." });
  }

  const generatedId = Date.now().toString();
  const accountPayload = { id: generatedId, name, email, password };
  
  globalUsersList.push(accountPayload);
  personalStorageMap[generatedId] = []; // Provision baseline storage block layout

  res.status(201).json({ message: "Cloud box profile instantiated successfully!" });
});

// Authentication Validation Endpoint
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  const standardProfile = globalUsersList.find(
    u => u.email.toLowerCase() === email.toLowerCase() && u.password === password
  );

  if (!standardProfile) {
    return res.status(400).json({ error: "Invalid operational access credentials provided." });
  }

  res.json({
    sessionToken: "simulated-session-auth-token-string-" + standardProfile.id,
    userProfile: { id: standardProfile.id, name: standardProfile.name, email: standardProfile.email }
  });
});

/* --- DRIVE INTERACTION ROUTES --- */

// File Catalog Extraction Route
app.get('/api/drive/files', (req, res) => {
  const accountId = req.headers['x-user-identity'];
  if (!accountId || !personalStorageMap[accountId]) {
    return res.status(401).json({ error: "Missing or invalid driver authentication profile identifier mapping." });
  }
  res.json(personalStorageMap[accountId]);
});

// Target File Upload Processing Integration Pipeline
app.post('/api/drive/upload', uploadProcessor.single('cloudFile'), (req, res) => {
  const accountId = req.headers['x-user-identity'];
  if (!accountId || !personalStorageMap[accountId]) {
    return res.status(401).json({ error: "Invalid context operational parameters." });
  }
  if (!req.file) {
    return res.status(400).json({ error: "No storage item payload targeted inside form entity headers." });
  }

  const structuredFileObject = {
    fileId: Date.now().toString(),
    originalName: req.file.originalname,
    formattedSize: (req.file.size / (1024 * 1024)).toFixed(2) + " MB",
    downloadUrl: `/uploads/${req.file.filename}`,
    creationDate: new Date().toLocaleDateString()
  };

  personalStorageMap[accountId].push(structuredFileObject);
  res.status(201).json(structuredFileObject);
});

// Storage Object Destructuring Drop Route
app.delete('/api/drive/files/:id', (req, res) => {
  const accountId = req.headers['x-user-identity'];
  const targetId = req.params.id;

  if (personalStorageMap[accountId]) {
    personalStorageMap[accountId] = personalStorageMap[accountId].filter(item => item.fileId !== targetId);
    return res.json({ success: true, message: "Asset successfully scrubbed from persistent layout stack." });
  }
  res.status(404).json({ error: "Target catalog file context pointer match missing." });
});

/* --- SERVE REACT FRONTEND IN PRODUCTION --- */
app.use(express.static(path.join(__dirname, '../client/dist')));

app.get('/{*splat}', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/dist/index.html'));
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Cloud server active on port ${PORT}`));
