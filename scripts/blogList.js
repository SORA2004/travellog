// scripts/blogList.js

import { db } from './firebase.js';
import { collection, getDocs, orderBy, query } from 'https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js';

document.addEventListener('DOMContentLoaded', async () => {
  // 최근 게시물 섹션의 post-card-container를 선택
  const recentPostsSection = document.querySelector('.recent-posts .post-card-container');
  console.log('recentPostsSection:', recentPostsSection); // 추가된 콘솔 로그

  // post-card-container가 존재하는지 확인
  if (!recentPostsSection) {
    console.error('`.recent-posts .post-card-container` 요소를 찾을 수 없습니다.');
    return;
  }

  // Firestore에서 'blogs' 컬렉션의 문서를 가져오고, 'createdAt' 필드 기준 내림차순 정렬
  const q = query(collection(db, 'blogs'), orderBy('createdAt', 'desc'));

  try {
    const querySnapshot = await getDocs(q);
    querySnapshot.forEach((doc) => {
      const blog = doc.data();

      // 'createdAt' 필드가 존재하는지 확인
      if (!blog.createdAt) {
        console.warn(`문서 ID ${doc.id}에 'createdAt' 필드가 없습니다.`);
        return;
      }

      const blogCard = `
        <div class="post-card bg-white rounded-lg shadow-md overflow-hidden">
          <img src="${blog.coverImageURL || blog.authorPhotoURL}" alt="${blog.title}" class="w-full h-48 object-cover">
          <div class="post-info p-4">
            <div class="profile-info flex items-center mb-2">
              <img src="${blog.authorPhotoURL}" alt="프로필 사진" class="w-10 h-10 rounded-full mr-3">
              <span class="username text-lg font-semibold">${blog.authorName}</span>
            </div>
            <h3 class="text-xl font-bold mb-2">${blog.title}</h3>
            <p class="text-gray-600 mb-2">${new Date(blog.createdAt.seconds * 1000).toLocaleDateString()}</p>
            <p class="text-gray-700 mb-4">${blog.summary}</p>
            <button onclick="location.href='blog.html?id=${doc.id}'" class="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded">
              더 보기
            </button>
          </div>
        </div>
      `;
      recentPostsSection.innerHTML += blogCard;
    });
  } catch (error) {
    console.error('블로그 목록 가져오기 오류:', error);
  }
});
