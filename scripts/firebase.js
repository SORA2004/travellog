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
  signOut as firebaseSignOut 
} from 'https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js';
import { 
  getFirestore, 
  collection, 
  addDoc, 
  serverTimestamp, 
  query, 
  where, 
  getDocs,
  orderBy,     
  startAt,     
  endAt,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  increment,
  deleteDoc
} from 'https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js';
import { 
  getStorage, 
  ref, 
  uploadBytes, 
  getDownloadURL 
} from 'https://www.gstatic.com/firebasejs/9.22.2/firebase-storage.js';

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

// Firebase 초기화
let app;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}

// Firebase 서비스 초기화
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// 인증 지속성 설정
setPersistence(auth, browserLocalPersistence)
  .then(() => {
    console.log('인증 지속성 설정 성공');
  })
  .catch((error) => {
    console.error('인증 지속성 설정 오류:', error);
  });

// Google Auth Provider 설정
export const provider = new GoogleAuthProvider();

// 사용자 인증 상태를 감지하고 콜백 함수를 실행하는 함수
export function monitorAuthState(callback) {
  onAuthStateChanged(auth, (user) => {
    callback(user);
  });
}

// Firestore에 블로그 저장 함수
export async function saveBlog(blogTitle, blogContent, blogLocations, startDate, endDate, blogSummary, tags, coverImageURL = '') {
  const titleLowerCase = blogTitle.toLowerCase();
  const locationsLowerCase = blogLocations.map(location => location.toLowerCase());

  try {
    const docRef = await addDoc(collection(db, 'blogs'), {
      title: blogTitle,
      titleLowerCase: titleLowerCase,
      summary: blogSummary,
      content: blogContent, // 에디터 내용 저장
      location: blogLocations, // 배열로 저장
      locationLowerCase: locationsLowerCase,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      tags: tags || [], // 태그 저장
      coverImageURL: coverImageURL, // 커버 이미지 URL 저장
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      authorId: auth.currentUser ? auth.currentUser.uid : null,
      authorName: auth.currentUser ? auth.currentUser.displayName || 'Guest' : 'Guest',
      authorPhotoURL: auth.currentUser ? auth.currentUser.photoURL || 'https://via.placeholder.com/30' : 'https://via.placeholder.com/30',
      likes: 0
    });
    console.log("블로그가 저장되었습니다: ", docRef.id);
    return docRef;
  } catch (error) {
    console.error("블로그 저장 중 오류 발생: ", error);
    throw error;
  }
}

// 이미지 업로드 함수
export async function uploadImage(file) {
  try {
    const storageRef = ref(storage, `blog-images/${file.name}_${Date.now()}`);
    const snapshot = await uploadBytes(storageRef, file);
    const url = await getDownloadURL(snapshot.ref);
    console.log("이미지가 업로드되었습니다:", url);
    return url;
  } catch (error) {
    console.error("이미지 업로드 중 오류 발생:", error);
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
    where('titleLowerCase', '>=', lowerCaseQuery),
    where('titleLowerCase', '<=', lowerCaseQuery + '\uf8ff'),
    orderBy('titleLowerCase')
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

// 댓글 추가 함수
export async function addComment(blogId, userId, userName, userPhotoURL, text) {
  try {
    const commentRef = await addDoc(collection(db, 'comments'), {
      blogId: blogId,
      userId: userId,
      userName: userName,
      userPhotoURL: userPhotoURL,
      text: text,
      createdAt: serverTimestamp()
    });
    console.log("댓글이 추가되었습니다: ", commentRef.id);
    return commentRef;
  } catch (error) {
    console.error("댓글 추가 중 오류 발생: ", error);
    throw error;
  }
}

// 특정 블로그의 댓글 가져오기 함수
export async function getComments(blogId) {
  try {
    const commentsQuery = query(
      collection(db, 'comments'),
      where('blogId', '==', blogId),
      orderBy('createdAt', 'asc')
    );
    const querySnapshot = await getDocs(commentsQuery);
    const comments = [];
    querySnapshot.forEach((doc) => {
      comments.push({ id: doc.id, ...doc.data() });
    });
    return comments;
  } catch (error) {
    console.error("댓글 가져오기 중 오류 발생: ", error);
    throw error;
  }
}

// 좋아요 추가 함수
export async function addLike(blogId, userId) {
  const blogRef = doc(db, 'blogs', blogId);
  const likeRef = doc(db, 'likes', blogId, 'userLikes', userId);
  try {
    await updateDoc(blogRef, {
      likes: increment(1)
    });
    await setDoc(likeRef, {
      liked: true
    });
    console.log("좋아요가 추가되었습니다.");
  } catch (error) {
    console.error("좋아요 추가 중 오류 발생: ", error);
    throw error;
  }
}

// 좋아요 취소 함수
export async function removeLike(blogId, userId) {
  const blogRef = doc(db, 'blogs', blogId);
  const likeRef = doc(db, 'likes', blogId, 'userLikes', userId);
  try {
    await updateDoc(blogRef, {
      likes: increment(-1)
    });
    await deleteDoc(likeRef);
    console.log("좋아요가 취소되었습니다.");
  } catch (error) {
    console.error("좋아요 취소 중 오류 발생: ", error);
    throw error;
  }
}

// 좋아요 상태 확인 함수
export async function hasUserLiked(blogId, userId) {
  const likeRef = doc(db, 'likes', blogId, 'userLikes', userId);
  const likeSnap = await getDoc(likeRef);
  return likeSnap.exists() && likeSnap.data().liked;
}

// 필요한 함수들을 개별적으로 내보내기
export { 
  signInWithPopup, 
  signInAnonymously, 
  firebaseSignOut as signOut
};
