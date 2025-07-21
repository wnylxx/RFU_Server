// ioHandler

// 내부 저장용 객체
// const connectedDevices = {}; // deviceID -> { socketId, project }
// const updateResults = {};    // deviceId -> { success, project }
const fs = require('fs');
const path = require('path');
const logWithTime = require('../utils/logWithTime');

module.exports = (io, app) => {
    const connectedDevices = app.get('connectedDevices');
    const updateResults = app.get('updateResults');


    io.on('connection', socket => {
        logWithTime(`[소켓 연결됨] id: ${socket.id}`);

        const app = io.httpServer._app; // Express 앱 참조

        if (!app) {
            console.error('[오류] Express 앱을 찾을 수 없습니다.');
            return;
        }

        // 장치 등록
        socket.on('registerProject', ({ project, deviceId }) => {
            logWithTime(`[등록] ${deviceId} => ${project}`);
            socket.join(project); // 해당 프로젝트 room에 가입

            connectedDevices[deviceId] = {
                socketId: socket.id,
                project
            };

            logWithTime(connectedDevices);

            // Express 앱에 상태 저장
            app.set('connectedDevices', connectedDevices);
        });

        socket.on('updateResult', ({ project, deviceId, success }) => {
            logWithTime(`[업데이트 결과] 프로젝트: ${project}, 디바이스: ${deviceId}, 성공여부: ${success}`);

            const updateResults = app.get('updateResults') || {};
            const targetDevices = app.get(`projectTargetDevices_${project}`) || [];

            // emit으로 명령을 받은 대상이 아닌 경우 → 무시
            if (!targetDevices.includes(deviceId)) {
                console.warn(`[경고] updateResult 받았지만 대상 디바이스가 아님: ${deviceId}`);
                return;
            }


            updateResults[deviceId] = {
                success,
                project
            };

            // Express 앱에 상태 저장
            app.set('updateResults', updateResults);

        });

        // 소켓 연결 종료
        socket.on('disconnect', () => {
            logWithTime(`[소켓 연결 종료] id: ${socket.id}`);

            const disconnectedId = Object.keys(connectedDevices).find(
                id => connectedDevices[id].socketId === socket.id
            );
            if (disconnectedId) {
                delete connectedDevices[disconnectedId];
                app.set('connectedDevices', connectedDevices);
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

        // // Express에서 접근 가능 하도록 저장
        // io.connectedDevices = connectedDevices;
        // io.updateResults = updateResults;

        app.set('connectedDevices', connectedDevices);
        app.set('updateResults', updateResults);
    });
};