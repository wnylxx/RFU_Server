// ioHandler

module.exports = (io) => {
    io.on('connection', socket => {
        console.log(`[소켓 연결됨] id: ${socket.id}`); // 이거 deviceId로 바꾸는거 어떤지

        socket.on('registerProject', ({ project, deviceId }) => {
            console.log(`[등록] ${deviceId} => ${project}`);
            socket.join(project); // 해당 프로젝트 room에 가입
        });

        socket.on('updateResult', ({ project, deviceId, success }) => {
            console.log(`[업데이트 결과] 프로젝트: ${project}, 디바이스: ${deviceId}, 성공여부: ${success}`);
        });

        socket.on('disconnect', () => {
            console.log(`[소켓 연결 종료] id: ${socket.id}`);  // 이것도 deviceId로 바꾸는거 어떤지
        });
    });
};