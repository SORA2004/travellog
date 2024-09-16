// removeFields.js

const admin = require('firebase-admin');
const serviceAccount = require('./path-to-service-account-key.json'); // 서비스 계정 키 파일 경로

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function removeFields() {
  const blogsRef = db.collection('blogs');
  const snapshot = await blogsRef.get();

  const batch = db.batch();

  snapshot.forEach(doc => {
    const docRef = blogsRef.doc(doc.id);
    batch.update(docRef, {
      comments: admin.firestore.FieldValue.delete(),
      visibility: admin.firestore.FieldValue.delete()
    });
  });

  await batch.commit();
  console.log('comments 및 visibility 필드가 모두 제거되었습니다.');
}

removeFields().catch(console.error);
