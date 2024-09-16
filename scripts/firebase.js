// scripts/firebase.js

import { 
  initializeApp, 
  getApps 
} from 'https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js';
import { 
  getAuth, 
  setPersistence, 
  browserLocalPersistence,
  GoogleAuthProvider, 
  signInWithPopup, 
  signInAnonymously, 
  onAuthStateChanged, 
  signOut 
} from 'https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js';
import { 
  getFirestore, 
  collection, 
  addDoc, 
  serverTimestamp, 
  query, 
  where, 
  getDocs,
  orderBy,     // 추가
  startAt,     // 추가
  endAt        // 추가
} from 'https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js';


// Firebase 설정
const firebaseConfig = {
  apiKey: 'AIzaSyAAbS3wIcaCay6VKuAJySBe4k5Q_5zPF1M',
  authDomain: 'travellog-3da51.firebaseapp.com',
  projectId: 'travellog-3da51',
  storageBucket: 'travellog-3da51.appspot.com',
  messagingSenderId: '635303327353',
  appId: '1:635303327353:web:47a229b964291c2e31c6a8',
  measurementId: 'G-YHD7HX2BX8',
};

// Initialize Firebase
let app;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}

// Initialize Auth and Firestore
export const auth = getAuth(app);
export const db = getFirestore(app);

// 인증 지속성 설정
setPersistence(auth, browserLocalPersistence)
  .then(() => {
    // 인증 지속성 설정 성공
  })
  .catch((error) => {
    // 인증 지속성 설정 실패
    console.error('인증 지속성 설정 오류:', error);
  });

// Define provider globally
export const provider = new GoogleAuthProvider();

// 로그인 상태를 감지하고 콜백 함수를 실행하는 함수
export function monitorAuthState(callback) {
  onAuthStateChanged(auth, (user) => {
    callback(user);
  });
}

// Firestore에 블로그 저장 함수
// firebase.js

export async function saveBlog(blogTitle, blogContent, blogLocation, startDate, endDate, blogSummary, tags) {
  const titleLowerCase = blogTitle.toLowerCase();
  const locationLowerCase = blogLocation.toLowerCase();

  try {
    const docRef = await addDoc(collection(db, 'blogs'), {
      title: blogTitle,
      titleLowerCase: titleLowerCase,
      summary: blogSummary,
      content: blogContent, // 에디터 내용 저장
      location: blogLocation,
      locationLowerCase: locationLowerCase,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      tags: tags || [], // 태그 저장
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      authorId: auth.currentUser ? auth.currentUser.uid : null,
      authorName: auth.currentUser ? auth.currentUser.displayName || 'Guest' : 'Guest',
      authorPhotoURL: auth.currentUser ? auth.currentUser.photoURL || 'default-photo-url.jpg' : 'default-photo-url.jpg',
      likes: 0
    });
    console.log("블로그가 저장되었습니다: ", docRef.id);
    return docRef;
  } catch (error) {
    console.error("블로그 저장 중 오류 발생: ", error);
    throw error;
  }
}


// 검색 기능 실행 함수
export async function searchBlogsByTitle(searchQuery) {
  if (!searchQuery) return [];

  const lowerCaseQuery = searchQuery.toLowerCase();
  const blogsRef = collection(db, 'blogs');

  // 쿼리 작성 시 orderBy 추가
  const q = query(
    blogsRef,
    orderBy('titleLowerCase'),
    startAt(lowerCaseQuery),
    endAt(lowerCaseQuery + '\uf8ff')
  );

  console.log(`Searching for titleLowerCase starting with "${lowerCaseQuery}"`);

  try {
    const querySnapshot = await getDocs(q);
    console.log(`Number of documents found: ${querySnapshot.size}`);

    const results = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      console.log('Document data:', data);
      results.push({
        id: doc.id, // 문서 ID 추가
        title: data.title,
        summary: data.summary,
        location: data.location,
        startDate: data.startDate,
        endDate: data.endDate
      });
    });

    console.log('검색 결과:', results);
    return results;

  } catch (error) {
    console.error('검색 오류:', error);
    return [];
  }
}


// 필요한 함수들을 개별적으로 내보내기
export { 
  signInWithPopup, 
  signInAnonymously, 
  signOut 
};
