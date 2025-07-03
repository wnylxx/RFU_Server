const path = require('path');
const fs = require('fs');
const { version } = require('os');
const versionPath = path.join(__dirname, '..', 'version.json')

function readVersionData() {
    return fs.existsSync(versionPath) ? JSON.parse(fs.readFileSync(versionPath, 'utf-8')) : {};
}


function writeVersionData(data) {
    fs.writeFileSync(versionPath, JSON.stringify(data, null, 2));
}

exports.handleUpload = (io) => (req, res) => {
    const { project, version } = req.body;

    if (!project || !version || !req.file) {
        return res.status(400).json({ message: 'Missing parameters or file' });
    }

    console.log(`[업로드] ${project} - ${version} 업로드됨`);

    const versionData = readVersionData();
    versionData[project] = version;
    writeVersionData(versionData);

    io.to(project).emit('updateAvailable', {
        project,
        version,
        url: `/uploads/${project}/${version}.zip`
    });

    res.json({ message: '업로드 및 알림 성공' });
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

    res.json({ verison });
};

