const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const mysql = require('mysql2/promise');


// console.log('--- DB 연결 정보 확인 ---');
// console.log(`HOST: ${process.env.DB_HOST}`);
// console.log(`USER: ${process.env.DB_USER}`);
// console.log(`PORT: ${process.env.DB_PORT}`);
// console.log(`DATABASE: ${process.env.DB_DATABASE}`);
// console.log('--------------------------');

// DB 커넥션 풀 생성
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
  database: process.env.DB_DATABASE,
  waitForConnections: true,
  connectionLimit: 300,
  queueLimit: 0
});






/**
 * cms DB의 devices 테이블에서 모든 dev_id를 조회하여 반환하는 함수
 * @returns {Promise<string[]>} dev_id 배열
 */
async function getDeviceIds() {
  let connection;
  try {
    connection = await pool.getConnection(); // 커넥션 풀에서 연결 가져오기
    const [rows] = await connection.query('SELECT dev_id FROM devices ORDER BY CAST(dev_id AS UNSIGNED), dev_id ASC');
    // 결과가 [{dev_id: 'id1'}, {dev_id: 'id2'}] 형태이므로 map을 이용해 값만 추출
    return rows.map(row => row.dev_id);
  } catch (error) {
    console.error('DB 조회 중 오류 발생:', error);
    // 실제 프로덕션 환경에서는 좀 더 정교한 에러 처리가 필요할 수 있습니다.
    return []; // 오류 발생 시 빈 배열 반환
  } finally {
    if (connection) {
      connection.release(); // 사용한 커넥션은 반드시 반납해야 합니다.
    }
  }
}

module.exports = { getDeviceIds };

// 이 파일이 직접 실행되었을 때만 테스트 코드를 실행합니다.
// (require.main === module)은 이 파일이 node의 메인 모듈로 실행되었는지 확인합니다.
if (require.main === module) {
  (async () => {
    console.log('getDeviceIds 함수를 테스트합니다...');
    try {
      const deviceIds = await getDeviceIds();
      console.log('조회 결과:', deviceIds);
    } catch (error) {
      console.error('테스트 중 오류 발생:', error);
    } finally {
      await pool.end(); // 테스트가 끝나면 커넥션 풀을 닫습니다.
      console.log('테스트 완료. DB 커넥션 풀이 종료되었습니다.');
    }
  })();
}