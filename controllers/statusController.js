// statusController

function groupByProject(devices) {
    const result = {};
    for (const [deviceId, { socketId, project }] of Object.entries(devices)) {
        if (!result[project]) result[project] = {};
        result[project][deviceId] = { socketId };
    }

    return result;
}

exports.getConnectedDevices = (req, res) => {
    const io = req.app.get('socketio');
    const devices = io.connectedDevices || {};
    
    console.log("device:", devices);

    const grouped = groupByProject(devices);
    res.json({ projects: grouped });
};

exports.getUpdateSummary = (req, res) => {
    const io = req.app.get('socketio');
    const results = io.updateResults || {};

    const project = req.query.project;
    if (!project) return res.status(400).json({ error: 'Project name is required' });

    const filtered = Object.entries(results)
        .filter(([_, r]) => r.project === project);

    const total = filtered.length;
    const successList = filtered.filter(([_, r]) => r.success).map(([id]) => id);
    const failList = filtered.filter(([_, r]) => !r.success).map(([id]) => id);

    res.json({
        total,
        success: successList.length,
        failure: failList.length,
        failedDevices: failList
    });
};