require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
// const multer = require('multer');
const path = require('path');
// const fs = require('fs');
const cors = require('cors');


const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST'],
    },
});



// 미들 웨어
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads'))); // 보안 처리 필요


// 소켓 등록
require('./sockets/ioHandler')(io);


// io 객체를 express에 넘겨줌
app.set('socketio', io);


// 라우트
const apiRoutes = require('./routes/api')(io);
app.use('/api', apiRoutes);


// 서버 실행
const PORT = process.env.PORT
server.listen(PORT, () => {
    console.log(`서버가 http://localhost:${PORT} 에서 실행 중입니다.`);
});


