const express = require('express');
const multer = require('multer');
const path = require('path');
const app = express();

// 저장 경로
const uploadPath = '/저장경로'

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadPath);
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname); // 원본 파일명 그대로 저장
    }
});


const upload = multer({ storage: storage });

app.post('/upload', upload.single('zipfile'), (req, res) => {
    res.send('File uploaded successfully');
});

app.listen(1234, () => {
    console.log('Server listening on port 1234');
});