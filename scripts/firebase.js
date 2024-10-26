// scripts/firebase.js

// Firebase 모듈 임포트 (ES6 모듈 방식)
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

// Firebase 설정 (본인의 Firebase 프로젝트 정보로 대체하세요)
const firebaseConfig = {
  apiKey: "AIzaSyAAbS3wIcaCay6VKuAJySBe4k5Q_5zPF1M",
  authDomain: "travellog-3da51.firebaseapp.com",
  projectId: "travellog-3da51",
  storageBucket: "travellog-3da51.appspot.com",
  messagingSenderId: "635303327353",
  appId: "1:635303327353:web:47a229b964291c2e31c6a8",
  measurementId: "G-YHD7HX2BX8"
};

// Firebase 초기화
let app;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}

// Firebase 서비스 초기화
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// 인증 지속성 설정
setPersistence(auth, browserLocalPersistence)
  .then(() => {
    console.log('인증 지속성 설정 성공');
  })
  .catch((error) => {
    console.error('인증 지속성 설정 오류:', error);
  });

// Google Auth Provider 설정
const provider = new GoogleAuthProvider();

// 사용자 인증 상태 감지 함수
function monitorAuthState(callback) {
  onAuthStateChanged(auth, (user) => {
    callback(user);
  });
}

// 블로그 저장 함수
async function saveBlog(
  blogTitle,
  blogContent,
  blogLocations,
  startDate,
  endDate,
  blogSummary,
  tags,
  coverImageURL = ''
) {
  const titleLowerCase = blogTitle.toLowerCase();
  const locationsLowerCase = blogLocations.map(location => location.toLowerCase());

  try {
    const blogData = {
      title: blogTitle,
      titleLowerCase: titleLowerCase,
      summary: blogSummary,
      content: blogContent,
      location: blogLocations,
      locationLowerCase: locationsLowerCase,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      tags: tags || [],
      coverImageURL: coverImageURL,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      authorId: auth.currentUser ? auth.currentUser.uid : null,
      authorName: auth.currentUser ? auth.currentUser.displayName || 'Guest' : 'Guest',
      authorPhotoURL: auth.currentUser ? auth.currentUser.photoURL || 'https://via.placeholder.com/30' : 'https://via.placeholder.com/30',
      likes: 0,
      views: 0,
    };

    // 블로그 문서 추가
    const blogRef = await addDoc(collection(db, 'blogs'), blogData);

    // userViews 서브컬렉션에 초기 값 추가
    if (auth.currentUser) {
      const userViewRef = doc(db, 'blogs', blogRef.id, 'userViews', auth.currentUser.uid);
      await setDoc(userViewRef, { count: 0 }); // 기본 조회수 0으로 초기화
    }

    console.log("블로그와 userViews가 성공적으로 생성되었습니다: ", blogRef.id);
    return blogRef;
  } catch (error) {
    console.error("블로그 저장 중 오류 발생: ", error);
    throw error;
  }
}

// 이미지 업로드 함수
async function uploadImage(file) {
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

// 제목으로 블로그 검색 함수
async function searchBlogsByTitle(searchQuery) {
  if (!searchQuery) return [];

  const lowerCaseQuery = searchQuery.toLowerCase();
  const blogsRef = collection(db, 'blogs');

  const q = query(
    blogsRef,
    where('titleLowerCase', '>=', lowerCaseQuery),
    where('titleLowerCase', '<=', lowerCaseQuery + '\uf8ff'),
    orderBy('titleLowerCase')
  );

  console.log(`"${lowerCaseQuery}"로 시작하는 제목 검색`);

  try {
    const querySnapshot = await getDocs(q);
    console.log(`검색된 문서 수: ${querySnapshot.size}`);

    const results = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      console.log('문서 데이터:', data);
      results.push({
        id: doc.id,
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
async function addComment(blogId, userId, userName, userPhotoURL, text) {
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
async function getComments(blogId) {
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
async function addLike(blogId, userId) {
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
async function removeLike(blogId, userId) {
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

// 사용자가 이미 좋아요를 눌렀는지 확인하는 함수
async function hasUserLiked(blogId, userId) {
  const likeRef = doc(db, 'likes', blogId, 'userLikes', userId);
  const likeSnap = await getDoc(likeRef);
  return likeSnap.exists() && likeSnap.data().liked;
}

// 필요한 함수들과 변수들을 내보내기
export { 
  auth,
  db,
  storage,
  provider,
  signInWithPopup, 
  signInAnonymously, 
  firebaseSignOut as signOut,
  monitorAuthState,
  saveBlog,
  uploadImage,
  searchBlogsByTitle,
  addComment,
  getComments,
  addLike,
  removeLike,
  hasUserLiked
};
