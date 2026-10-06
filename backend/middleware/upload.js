const multer = require('multer');
const path = require('path');
const crypto = require('crypto');

// Store uploads locally
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${crypto.randomUUID()}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf'];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only JPG, PNG, WEBP, and PDF files are allowed'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB limit
});

const uploadSingle = (fieldName) => (req, res, next) => {
  const singleHandler = upload.single(fieldName);
  singleHandler(req, res, (err) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ success: false, message: 'Uploaded file size exceeds 25MB limit' });
      }
      return res.status(400).json({ success: false, message: err.message || 'File upload failed' });
    }
    next();
  });
};

module.exports = upload;
module.exports.uploadSingle = uploadSingle;
