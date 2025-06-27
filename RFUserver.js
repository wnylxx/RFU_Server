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
    destination: (req, file, cb) => {
        const project = req.body.project;
        // const version = req.body.version; 
        const dir = path.join(__dirname, 'uploads', project);
        fs.mkdirSync(dir, { recursive: true });                     // 디렉토리가 없으면 재귀적으로 생성하겠다. 
        cb(null, dir);                                              // 이 경로로 파일을 저장한다.
    },
    filename: (req, file, cb) => {
        const version = req.body.version;
        cb(null, `${version}.zip`);
    },
});

const upload = multer({ storage });

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads'))); // 보안 처리 필요



// 파일 업로드 API
// body: project, version, file(zip)

app.post('/api/upload', upload.single('file'), (req, res) => {
    const { project, version } = req.body;

    if (!project || !version || !req.file) {
        return res.status(400).json({ message: 'Missing parameters or file' });
    }

    console.log(`[업로드] ${project} - ${version} 업로드됨`);

    // 버전 기록
    const versionPath = path.join(__dirname, 'version.json');
    let versionData = [];

    if (fs.existsSync(versionPath)) {
        versionData = JSON.parse(fs.readFileSync(versionPath, 'utf-8'));
    }

    // 버전 갱신
    versionData[project] = version;

    // 저장 (정렬 포함 - 보기 편하게)
    fs.writeFileSync(versionPath, JSON.stringify(versionData, null, 2));

    // 해당 프로젝트 클라이언트에 업데이트 알림
    io.to(project).emit('updateAvailable', {
        project,
        version,
        url: `/uploads/${project}/${version}.zip`
    });

    res.json({ message: '업로드 및 알림 성공' });

});


app.get('/api/version', (req, res) => {
    const project = req.query.project;

    if (!project) {
        return res.status(400).json({ error: 'Missing project name' });
    }

    const versionPath = path.join(__dirname, 'version.json');

    if (!fs.existsSync(versionPath)) {
        return res.status(404).json({ error: 'Version file not found'});
    }

    const versionData = JSON.parse(fs.readFileSync(versionPath, 'utf-8'));

    const version = versionData[project];

    if(!version) {
        return res.json({ message: '버전 정보가 없습니다' });
    }

    res.json({ version });
});


io.on('connection', socket => {
    console.log(`[소켓 연결됨] id: ${socket.id}`);

    // 클라이언트가 소속 프로젝트를 알려줌
    socket.on('registerProject', ({ project, deviceId }) => {
        console.log(`[등록] ${deviceId} → ${project}`);
        socket.join(project); // 해당 프로젝트 room에 가입
    });

    socket.on('updateResult', ({ project, deviceId, success }) => {
        console.log(`[업데이트 결과] 프로젝트: ${project}, 디바이스: ${deviceId}, 성공여부: ${success}`)
    })

    socket.on('disconnect', () => {
        console.log(`[소켓 연결 종료] id: ${socket.id}`);
    });
})


server.listen(PORT, () => {
    console.log(`서버가 http://localhost:${PORT} 에서 실행 중입니다.`);
});



// 테스트 용

app.post('/api/trigger-update', (req, res) => {
    const { project, version } = req.body;

    if (!project || !version) {
        return res.status(400).json({ error: 'project와 version을 모두 입력하세요.' });
    }

    const url = `/uploads/${project}/${version}.zip`;

    io.to(project).emit("updateAvailable", {
        project,
        version,
        url
    });

    console.log(`🔔 ${project} 프로젝트에 updateAvailable emit 완료 (v${version})`);

    res.status(200).json({ message: 'emit 성공', sent: { project, version, url } });
});