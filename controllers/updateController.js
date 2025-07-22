
const logWithTime = require('../utils/logWithTime');
const { emitCommandToDevices } = require('./deviceManager');

exports.handleBackupOnly = (io) => async (req, res) => {
    const {project} = req.body;

    if (!project) {
        return res.status(400).json({ message: 'project required'});
    }

    const app = req.app;
    const results = await emitCommandToDevices({
        io,
        app,
        commandType: 'backupOnly',
        project
    });

    res.json({
        message: '백업 명령 전송 완료',
        resultCount: results.length,
        results
    });

    // 이게 result 결과를 내 PC 로 보내느 부분이지?
};

// 이거 updateOnly로 바꾸자
exports.handleUploadOnly = (io) => async (req,res) => {
    const { project, version } = req.body;
    const url = `/uploads/${project}/${version}.zip`;

    if(!project || !version) {
        return res.status(400).json({message: 'project/version required'});
    }

    const app = req.app;
    const results = await emitCommandToDevices({
        io,
        app,
        commandType: 'uploadOnly',
        project,
        version,
        url
    });

    res.json({
        message: '파일 덮어쓰기 명령 전송 완료',
        resultCount: results.length,
        results
    });
};


exports.handleRollbackOnly = (io) => async (req,res) => {
    const {project} = req.body;

    if (!project) {
        return res.status(400).json({ message: 'project required'});
    }

    const app = req.app;
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

