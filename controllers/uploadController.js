const path = require('path');
const fs = require('fs');
const { version } = require('os');
const versionPath = path.join(__dirname, '..', 'version.json')

const { emitCommandToDevices  } = require('./deviceManager');
const logWithTime = require('../utils/logWithTime');


function readVersionData() {
    return fs.existsSync(versionPath) ? JSON.parse(fs.readFileSync(versionPath, 'utf-8')) : {};
}


function writeVersionData(data) {
    fs.writeFileSync(versionPath, JSON.stringify(data, null, 2));
}

exports.handleUpload = (io) => async (req, res) => {
    const { project, version } = req.body;

    if (!project || !version || !req.file) {
        return res.status(400).json({ message: 'Missing parameters or file' });
    }

    logWithTime(`[업로드] ${project} - ${version} 업로드됨`);

    const versionData = readVersionData();
    versionData[project] = version;
    writeVersionData(versionData);

    const url = `/uploads/${project}/${version}.zip`;

    const app = req.app;

    // 이전 업데이트 상태 초기화
    const connectedDevices = app.get('connectedDevices') || {};
    Object.keys(connectedDevices).forEach(deviceId => {
        if (connectedDevices[deviceId].project === project) {
            connectedDevices[deviceId].lastUpdateStatus = null;
        }
    });
    app.set('connectedDevices', connectedDevices);

    // emit 및 결과 대기
    const results = await emitCommandToDevices({
        io,
        app,
        commandType: 'updateFull',
        project,
        version,
        url
    });

    res.json({
        message: 'updateFull 명령 전송 완료', // 변경
        resultCount: results.length,
        results
    });
};

exports.getVersion = (req, res) => {
    const project = req.query.project;

    if (!project) {
        return res.status(400).json({ error: 'Missing project name' });
    }

    const versionData = readVersionData();
    const version = versionData[project];

    if(!version) {
        return res.json({ message: '버전 정보가 없습니다.' });
    }

    res.json({ version });
};

