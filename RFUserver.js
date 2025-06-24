require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cors = require('cors');


const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST'],
    },
});

const PORT = process.env.PORT

// zip 저장 경로 설정
const storage = multer.diskStorage({
    destination: (req,file, cb) => {
        const project = req.body.project;
        const version = req.body.version;
        const dir = path.join(__dirname, 'uploads', project);
        fs.mkdirSync(dir, { recursive: true });
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        const version = req.body.version;
        cb(null, `${version}.zip`);
    },
});

const upload = multer({ storage });

app.use(cors());
app.use(express.json());


// 파일 업로드 API
// body: project, version, file(zip)

app.post('/api/upload', upload.single('file'), (req, res) => {
    const { project, version } = req.body;

    if(!project || !version || !req.file) {
        return res.status(400).json({ message: 'Missing parameters or file' });
    }

    console.log(`[업로드] ${project} - ${version} 업로드됨`);

    // 버전 기록
    const versionPath = path.join(__dirname, 'uploads', project, 'version.json');
    let versions = [];

    if (fs.existsSync(versionPath)) {
        versions = JSON.parse(fs.readFileSync(versionPath));
    }

    if (!versions.includes(version)) {
        versions.push(version);
        fs.writeFileSync(versionPath, JSON.stringify(versions, null, 2));
    }

    // 해당 프로젝트 클라이언트에 업데이트 알림
    io.to(project).emit('updateAvailable', {
        project,
        version,
        url: `/updates/${project}/${version}.zip`
    });

    res.json({ message: '업로드 및 알림 성공' });

});

io.on('connection', socket => {
    console.log(`[소켓 연결됨] id: ${socket.id}`);

    // 클라이언트가 소속 프로젝트를 알려줌
    socket.on('registerProject', ({ project, deviceId }) => {
        console.log(`[등록] ${deviceId} → ${project}`);
        socket.join(project); // 해당 프로젝트 room에 가입
    });

    socket.on('disconnect', () => {
        console.log(`[소켓 연결 종료] id: ${socket.id}`);
    });
})


server.listen(PORT, () => {
    console.log(`서버가 http://localhost:${PORT} 에서 실행 중입니다.`);
});