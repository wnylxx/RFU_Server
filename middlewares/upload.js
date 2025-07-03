const multer = require('multer');
const path = require('path');
const fs = require('fs');

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const project = req.body.project;
        const dir = path.join(__dirname, '..', 'uploads', project);
        fs.mkdirSync(dir, { recursive: true });  // 디렉토리가 없으면 재귀적으로 생성하겠다.
        cb(null, dir);                           // 이 경로로 파일을 저장한다.
    },
    filename: (req, file, cb) => {
        const version = req.body.version;
        cb(null, `${version}.zip`);
    }
});

module.exports = multer({ storage });