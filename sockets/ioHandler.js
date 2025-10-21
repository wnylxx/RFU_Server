// ioHandler
const fs = require('fs');
const path = require('path');
const logWithTime = require('../utils/logWithTime');

module.exports = (io, app) => {
    /* 
        연결된 장치 관리 deviceID -> { socketId, project, version, lastSeen, isConnected, updateHistory}
    */
    const connectedDevices = app.get('connectedDevices') || {};


    io.on('connection', socket => {
        logWithTime(`[소켓 연결됨] id: ${socket.id}`);

        const app = io.httpServer._app; // Express 앱 참조

        if (!app) {
            console.error('[오류] Express 앱을 찾을 수 없습니다.');
            return;
        }

        // 장치 등록
        socket.on('registerProject', ({ project, deviceId }) => {
            logWithTime(`[등록] ${deviceId} => ${project} (socketId: ${socket.id})`);
            socket.join(project); // 해당 프로젝트 room에 가입

            // 기존에 deviceId 정보가 있을 경우
            if (connectedDevices[deviceId]) {
                connectedDevices[deviceId].socketId = socket.id;
                connectedDevices[deviceId].isConnected = true;
                connectedDevices[deviceId].lastSeen = new Date();
                logWithTime(`[재연결] Device_ID: ${deviceId}`);
            } else {
                // 새롭게 등록
                connectedDevices[deviceId] = {
                    socketId: socket.id,
                    project,
                    version: "0.0.0",
                    lastSeen: new Date(),
                    isConnected: true,
                    updateHistory: [],  // 업데이트 이력 배열
                };
            }

            logWithTime(connectedDevices);

            // Express 앱에 상태 저장
            app.set('connectedDevices', connectedDevices);
        });


        // Rpi의 버전 정보 수신
        socket.on('versionReport', ({ project, deviceId, version }) => {
            logWithTime(`[버전 정보 수신] ${deviceId} => v${version} (프로젝트: ${project})`);
            if (connectedDevices[deviceId]) {
                connectedDevices[deviceId].version = version;
                connectedDevices[deviceId].lastSeen = new Date();
                connectedDevices[deviceId].isConnected = true;
                
                // Express 앱에 상태 저장
                app.set('connectedDevices', connectedDevices);
            }
        });


        socket.on('updateResult', ({ project, deviceId, success, version, error, mode }) => {
            logWithTime(`[업데이트 결과] 프로젝트: ${project}, 디바이스: ${deviceId}, 성공여부: ${success}`);

            const updateResults = app.get('updateResults') || {};
            const targetDevices = app.get(`projectTargetDevices_${project}`) || [];

            // emit으로 명령을 받은 대상이 아닌 경우 → 무시
            if (!targetDevices.includes(deviceId)) {
                console.warn(`[경고] updateResult 받았지만 대상 디바이스가 아님: ${deviceId}`);
                return;
            }

            const updateRecord = {
                success,
                project,
                version,
                error,
                mode,
                timestamp: new Date(),
                id: Date.now() + '_' + Math.random().toString(36).substr(2, 9)
            };


            // 연결 상태 업데이트 및 이력 저장
            if (connectedDevices[deviceId]) {
                connectedDevices[deviceId].lastSeen = new Date();
                connectedDevices[deviceId].isConnected = true;
                if (version) {
                    connectedDevices[deviceId].version = version;
                }
                
                // 업데이트 이력 추가 (최대 10개 유지)
                connectedDevices[deviceId].updateHistory.unshift(updateRecord);
                if (connectedDevices[deviceId].updateHistory.length > 10) {
                    connectedDevices[deviceId].updateHistory = connectedDevices[deviceId].updateHistory.slice(0, 10);
                }
            }

            // Express 앱에 상태 저장
            app.set('connectedDevices', connectedDevices);

        });


        // 소켓 연결 종료
        socket.on('disconnect', () => {
            logWithTime(`[소켓 연결 종료] id: ${socket.id}`);

            const disconnectedId = Object.keys(connectedDevices).find(
                id => connectedDevices[id].socketId === socket.id
            );

            if (disconnectedId) {
                logWithTime(`[디바이스 연결 끊김] Device_ID: ${disconnectedId}`);

                // 업데이트 명령 후 응답이 없는 경우
                const device = connectedDevices[disconnectedId];
                if (device.updateHistory.length === 0 || device.updateHistory[0]?.success !== undefined) {
                    // 업데이트 중이었는데 연결이 끊어진 경우
                    logWithTime(`[경고] 업데이트 중 연결 끊김 - Device_ID: ${disconnectedId}`);
                    
                    // 실패로 처리
                    const failedUpdate = {
                        success: false,
                        project: device.project,
                        version: "알 수 없음",
                        error: "업데이트 중 연결 끊어짐",
                        mode: "unknown",
                        timestamp: new Date(),
                        id: Date.now() + '_' + Math.random().toString(36).substr(2, 9)
                    };
                    
                    device.updateHistory.unshift(failedUpdate);
                }

                // 연결 정보는 유지하되 연결 상태만 false로 설정
                connectedDevices[disconnectedId].isConnected = false;
                connectedDevices[disconnectedId].socketId = null;
                app.set('connectedDevices', connectedDevices);


                logWithTime(connectedDevices);
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


        app.set('connectedDevices', connectedDevices);
    });
};