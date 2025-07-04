const express = require('express');
const router = express.Router();
const upload = require('../middlewares/upload');
const uploadController = require('../controllers/uploadController');

module.exports = (io) => {
    router.post('/upload', upload.single('file'), uploadController.handleUpload(io));
    router.get('/version', uploadController.getVersion);
    return router;
};