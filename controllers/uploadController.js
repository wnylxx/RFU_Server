const path = require('path');
const fs = require('fs');
const { version } = require('os');
const versionPath = path.join(__dirname, '..', 'version.json')

const { emitCommandToDevices  } = require('./deviceManager');

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

    console.log(`[업로드] ${project} - ${version} 업로드됨`);

    const versionData = readVersionData();
    versionData[project] = version;
    writeVersionData(versionData);

    const url = `/uploads/${project}/${version}.zip`;


    // emit 및 결과 대기
    const results = await emitCommandToDevices({
        io,
        commandType: 'updateAvailable',
        project,
        version,
        url
    });

    res.json({
        message: '업로드 및 업데이트 지시 완료',
        resultCount: results.length,
        results // deviceId, success, project
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

