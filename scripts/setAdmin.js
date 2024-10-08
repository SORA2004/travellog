// scripts/setAdmin.js

const admin = require('firebase-admin');
const path = require('path');

// 서비스 계정 키 파일의 경로 설정
const serviceAccount = require(path.join(__dirname, '../config/serviceAccountKey.json'));

// Firebase Admin SDK 초기화
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

// 관리자 권한을 부여할 사용자 UID 설정
const uid = 'sTjw5sSM2AUf0zUHDyayHwDEYaz2'; // 실제 사용자 UID로 교체하세요

// 커스텀 클레임 설정 함수
admin.auth().setCustomUserClaims(uid, { admin: true })
  .then(() => {
    console.log(`사용자 ${uid}에게 관리자 권한이 부여되었습니다.`);
  })
  .catch((error) => {
    console.error('커스텀 클레임 설정 오류:', error);
  });
