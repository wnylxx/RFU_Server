// statusController


// 변환함수 (내부 deviceId 기준 -> 외부 project 기준)
function groupByProject(devices) {
    const result = {};
    for (const [deviceId, { socketId, project }] of Object.entries(devices)) {
        if (!result[project]) result[project] = {};
        result[project][deviceId] = { socketId };
    }

    return result;
}

exports.getConnectedDevices = (req, res) => {
    // const io = req.app.get('socketio');
    // const devices = io.connectedDevices || {};
    const devices = req.app.get('connectedDevices') || {};


    console.log("device:", devices);

    const grouped = groupByProject(devices);
    res.json({ projects: grouped });
};

exports.getUpdateSummary = (req, res) => {
    const { project } = req.query;
    if (!project) return res.status(400).json({ message: "project required" });

    const connected = req.app.get("connectedDevices"); // deviceId -> { project, socketId }
    const updateResults = req.app.get("updateResults"); // deviceId -> { success, project }
    // const targetDevices = req.app.get(`projectTargetDevices_${project}`);


    // 이 프로젝트로 명령 보낸 대상자
    // const targetDevices = Object.entries(connected)
    //     .filter(([_, info]) => info.project === project)
    //     .map(([deviceId]) => deviceId);


    const targetDevices = req.app.get(`projectTargetDevices_${project}`) || [];
    console.log("getUpdateSummary-targetDevice :", targetDevices);

    const total = targetDevices.length;

    // 현재까지 받은 result
    const received = targetDevices.filter(id => updateResults[id]?.project === project);
    const receivedCount = received.length;


    // 아직 다 안 옴 → 진행중 상태
    if (receivedCount < total) {
        return res.json({
            status: "progress",
            total,
            received: receivedCount
        });
    }

    // 완료 상태 계산
    const failedDevices = received.filter(id => updateResults[id]?.success === false);
    const successCount = receivedCount - failedDevices.length;

    return res.json({
        status: "done",
        total,
        success: successCount,
        failure: failedDevices.length,
        failedDevices
    });
};