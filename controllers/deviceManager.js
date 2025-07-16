// deviceManager.js

const waitForAllResults = (deviceIds, updateResults, timeout = 30000) => {
    return new Promise((resolve) => {
        const start = Date.now();

        const interval = setInterval(() => {
            const receivedIds = Object.keys(updateResults);
            const done = deviceIds.every(id => receivedIds.includes(id));

            if (done || Date.now() - start > timeout) {
                clearInterval(interval);
                resolve(deviceIds.map(id => ({
                    deviceId: id,
                    success: updateResults[id]?.success ?? false,
                    project: updateResults[id]?.project ?? null
                })));
            }
        }, 1000);
    });
};


const emitCommandToDevices = async ({ io, app, commandType, project, version, url }) => {
    const connected = app.get('connectedDevices');
    console.log("✅ emit Command To Device - connectedDevices:", connected);
    const updateResults = app.get('updateResults');

    const targetDevices = Object.entries(connected)
        .filter(([_, { project: p }]) => p === project)
        .map(([deviceId, { socketId }]) => {
            if (io.sockets.sockets.get(socketId)) {
                io.sockets.sockets.get(socketId).emit(commandType, { project, version, url });
                return deviceId;
            }
            return null;
        }).filter(Boolean);

    console.log(`[명령 전송] ${commandType}: ${targetDevices.length}개 디바이스`);

    return await waitForAllResults(targetDevices, updateResults);
};

module.exports = {
    emitCommandToDevices
};