// scripts/recentPosts.js

import { auth, db } from './firebase.js';
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js';
import { collection, query, orderBy, limit, getDocs } from 'https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js';

document.addEventListener('DOMContentLoaded', () => {
  const recentPostsSection = document.getElementById('recentPostsSection');
  const postCardContainer = document.getElementById('postCardContainer');

  onAuthStateChanged(auth, async (user) => {
    if (user) {
      // 로그인된 상태이므로 '최근 읽은 로그' 섹션을 표시
      recentPostsSection.classList.remove('hidden');

      // 최근 읽은 로그를 불러와서 표시
      await loadRecentPosts(user);
    } else {
      // 로그인되지 않은 상태이므로 '최근 읽은 로그' 섹션을 숨김
      recentPostsSection.classList.add('hidden');
    }
  });
});

async function loadRecentPosts(user) {
  const postCardContainer = document.getElementById('postCardContainer');
  if (!postCardContainer) return;

  // Firestore에서 최근 게시물 가져오기 (예시)
  const blogsRef = collection(db, 'blogs');
  const q = query(blogsRef, orderBy('createdAt', 'desc'), limit(6));

  try {
    const querySnapshot = await getDocs(q);

    postCardContainer.innerHTML = '';

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      const postCard = createPostCard(doc.id, data);
      postCardContainer.appendChild(postCard);
    });
  } catch (error) {
    console.error('최근 게시물 불러오기 오류:', error);
  }
}

function createPostCard(id, data) {
  const card = document.createElement('div');
  card.classList.add('post-card', 'bg-white', 'shadow', 'rounded', 'overflow-hidden');

  card.innerHTML = `
    <img src="${data.coverImageURL || 'https://via.placeholder.com/150'}" alt="${data.title}" class="w-full h-48 object-cover">
    <div class="p-4">
      <h3 class="text-xl font-semibold mb-2">${data.title}</h3>
      <p class="text-gray-600 mb-4">${data.summary}</p>
      <button onclick="location.href='blog-detail.html?id=${id}'" class="text-blue-500 hover:underline">더 보기</button>
    </div>
  `;

  return card;
}
