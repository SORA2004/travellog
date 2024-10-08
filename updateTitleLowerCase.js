// updateTitleLowerCase.js

const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json'); // 서비스 계정 키 파일 경로

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function updateTitleLowerCase() {
  const blogsRef = db.collection('blogs');
  const snapshot = await blogsRef.get();

  const batch = db.batch();

  snapshot.forEach(doc => {
    const data = doc.data();
    const title = data.title || '';
    const titleLowerCase = title.toLowerCase();

    const docRef = blogsRef.doc(doc.id);
    batch.update(docRef, { titleLowerCase: titleLowerCase });
  });

  await batch.commit();
  console.log('모든 문서의 titleLowerCase 필드가 업데이트되었습니다.');
}

updateTitleLowerCase().catch(console.error);
