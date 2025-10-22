const express = require('express');
const router = express.Router();


const upload = require('../middlewares/upload');
const uploadController = require('../controllers/uploadController');
const statusController = require('../controllers/statusController');
const updateController = require('../controllers/updateController');


module.exports = (io) => {
    router.post('/upload', upload.single('file'), uploadController.handleUpload(io));
    router.get('/version', uploadController.getVersion);


    // 연결된 장비 보기
    router.get('/connected-devices', statusController.getConnectedDevices);

    // 업데이트 결과 요약
    router.get('/update-summary', statusController.getUpdateSummary);

    // 프로젝트별 장비 상태 목록
    router.get('/devices/:project', statusController.getDeviceStatus);

    // 롤백
    router.post('/rollback', updateController.handleRollbackOnly(io));
    

    return router;
};