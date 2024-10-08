// scripts/database.js

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
import { auth } from './firebase.js';

// Firestore 및 Storage 초기화
export const db = getFirestore();
export const storage = getStorage();

// Firestore에 블로그 저장 함수
export async function saveBlog(blogTitle, blogContent, blogLocation, startDate, endDate, blogSummary, tags, coverImageURL = '') {
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

// 기타 데이터베이스 관련 함수들...
