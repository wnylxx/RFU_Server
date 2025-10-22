
const logWithTime = require('../utils/logWithTime');
const { emitCommandToDevices } = require('./deviceManager');

exports.handleRollbackOnly = (io) => async (req,res) => {
    const {project} = req.body;

    if (!project) {
        return res.status(400).json({ message: 'project required'});
    }

    const app = req.app;

    // 이전 업데이트 상태 초기화
    const connectedDevices = app.get('connectedDevices') || {};
    Object.keys(connectedDevices).forEach(deviceId => {
        if (connectedDevices[deviceId].project === project) {
            connectedDevices[deviceId].lastUpdateStatus = null;
        }
    });
    app.set('connectedDevices', connectedDevices);

    const results = await emitCommandToDevices({
        io,
        app,
        commandType: 'rollbackOnly',
        project
    });

    res.json({
        message: '롤백 명령 전송',
        resultCount: results.length,
        results
    })
};

