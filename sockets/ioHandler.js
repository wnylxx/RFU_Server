// ioHandler

// 내부 저장용 객체
const connectedDevices = {}; // deviceID -> { socketId, project }
const updateResults = {};    // deviceId -> { success, project }


module.exports = (io) => {
    io.on('connection', socket => {
        console.log(`[소켓 연결됨] id: ${socket.id}`); 

        socket.on('registerProject', ({ project, deviceId }) => {
            console.log(`[등록] ${deviceId} => ${project}`);
            socket.join(project); // 해당 프로젝트 room에 가입

            connectedDevices[deviceId] = {
                socketId: socket.id,
                project
            };

            console.log(connectedDevices);
        });

        socket.on('updateResult', ({ project, deviceId, success }) => {
            console.log(`[업데이트 결과] 프로젝트: ${project}, 디바이스: ${deviceId}, 성공여부: ${success}`);

            updateResults[deviceId] = {
                success,
                project
            };
        });

        socket.on('disconnect', () => {
            console.log(`[소켓 연결 종료] id: ${socket.id}`);
            const disconnectedId = Object.keys(connectedDevices).find(
                id => connectedDevices[id].socketId === socket.id
            );
            if (disconnectedId) {
                delete connectedDevices[disconnectedId];
            }
        });


        socket.on('error', (err) => {
            if (err.code === 'EADDRINUSE') {
                console.error('Port is already in use');
                process.exit(1);
            } else {
                throw err;
            }
        });

        // Express에서 접근 가능 하도록 저장
        io.connectedDevices = connectedDevices;
        io.updateResults = updateResults;
    });
};