// scripts/blog-detail.js

import { db, auth } from './firebase.js';
import {
  onAuthStateChanged,
} from 'https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js';
import {
  collection,
  addDoc,
  serverTimestamp,
  query,
  where,
  getDoc,
  setDoc,
  deleteDoc,
  onSnapshot,
  getDocs,
  orderBy,
  increment,
  doc,
  updateDoc,
} from 'https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js';

// 좋아요 상태를 추적하기 위한 변수
let isLiked = false;

// 북마크 상태를 추적하기 위한 변수
let isBookmarked = false;

// 전역 변수로 blogPost 선언
let blogPost = null;

// URL에서 blogId 추출
const urlParams = new URLSearchParams(window.location.search);
const blogId = urlParams.get('id');

if (!blogId) {
  alert('블로그 ID가 없습니다.');
  throw new Error('블로그 ID가 없습니다.');
}

// Firestore에서 블로그 포스트 데이터 가져오기
async function fetchBlogPost(id) {
  const docRef = doc(db, 'blogs', id);
  const docSnap = await getDoc(docRef);

  if (docSnap.exists()) {
    const data = docSnap.data();
    console.log('블로그 데이터:', data);
    return { id: docSnap.id, ...data };
  } else {
    throw new Error('해당 블로그 포스트를 찾을 수 없습니다.');
  }
}

// 조회수 증가 함수
async function incrementViews(blogId) {
  const blogRef = doc(db, 'blogs', blogId);
  try {
    await updateDoc(blogRef, {
      views: increment(1),
    });
  } catch (error) {
    console.error('조회수 증가 오류:', error);
    alert('조회수를 증가시키는 중 오류가 발생했습니다.');
  }
}

// 페이지 초기화 함수
async function initializePage() {
  try {
    blogPost = await fetchBlogPost(blogId);
    await incrementViews(blogId);

    console.log('Fetched blog post:', blogPost);

    // 동적 콘텐츠 삽입
    updatePageContent();

    // 댓글 목록 불러오기
    loadComments();

    // 버튼 이벤트 리스너 추가
    setupEventListeners();

    // 실시간 업데이트 리스너 설정
    setupRealtimeListeners();
  } catch (error) {
    console.error('블로그 포스트를 불러오는 데 실패했습니다:', error);
    alert('블로그 포스트를 불러오는 데 실패했습니다.');
  }
}

// 페이지 콘텐츠 업데이트 함수
function updatePageContent() {
  // 각 요소 업데이트
  updateElement('postTitle', blogPost.title);
  document.title = `${blogPost.title} - Travellog`;

  const authorName = blogPost.authorName;
  const createdAt = blogPost.createdAt;
  const readTime = calculateReadTime(blogPost.content);

  const createdAtDate = getRelativeTime(createdAt);
  const postMeta = `작성자: ${authorName} | 작성일: ${getRelativeTimeLabel(createdAtDate)}`;
  updateElement('postMeta', postMeta);
  updateElement('postViews', blogPost.views || 0);
  updateElement('postDestinations', Array.isArray(blogPost.location) ? blogPost.location.join(', ') : blogPost.location || '-');
  updateElement('postTravelPeriods', (blogPost.startDate && blogPost.endDate) ? `${formatDate(blogPost.startDate)} ~ ${formatDate(blogPost.endDate)}` : '-');
  updateElementHTML('postContent', blogPost.content || '');
  updateElementHTML('postAdditionalContent', blogPost.additionalContent || '');
  setupCoverImage();
  setupTags();
}

// 요소 텍스트 업데이트 헬퍼 함수
function updateElement(elementId, text) {
  const elem = document.getElementById(elementId);
  if (elem) {
    elem.textContent = text;
  } else {
    console.warn(`Element with ID '${elementId}' not found.`);
  }
}

// 요소 HTML 업데이트 헬퍼 함수
function updateElementHTML(elementId, html) {
  const elem = document.getElementById(elementId);
  if (elem) {
    elem.innerHTML = html;
  } else {
    console.warn(`Element with ID '${elementId}' not found.`);
  }
}

// 커버 이미지 설정 함수
function setupCoverImage() {
  const coverImageContainer = document.getElementById('coverImageContainer');
  if (coverImageContainer) {
    const coverImageURL = blogPost.coverImageURL || 'https://via.placeholder.com/1200x600';
    coverImageContainer.style.backgroundImage = `linear-gradient(rgba(0, 0, 0, 0.1) 0%, rgba(0, 0, 0, 0.4) 100%), url("${coverImageURL}")`;

    // 이미지 로딩 오류 처리
    const img = new Image();
    img.src = coverImageURL;
    img.onerror = () => {
      coverImageContainer.style.backgroundImage = `linear-gradient(rgba(0, 0, 0, 0.1) 0%, rgba(0, 0, 0, 0.4) 100%), url("https://via.placeholder.com/1200x600")`;
    };
  } else {
    console.warn("Element with ID 'coverImageContainer' not found.");
  }
}

// 태그 삽입 함수
function setupTags() {
  const tagsContainer = document.getElementById('postTags');
  if (tagsContainer) {
    if (blogPost.tags && Array.isArray(blogPost.tags)) {
      tagsContainer.innerHTML = '';
      blogPost.tags.forEach(tag => {
        const tagElement = document.createElement('span');
        tagElement.className = 'bg-blue-100 text-blue-800 text-sm font-medium mr-2 px-2.5 py-0.5 rounded';
        tagElement.textContent = tag;
        tagsContainer.appendChild(tagElement);
      });
    }
  } else {
    console.warn("Element with ID 'postTags' not found.");
  }
}

// 버튼 이벤트 리스너 설정 함수
function setupEventListeners() {
  // 'Comment' 버튼
  const commentButton = document.getElementById('commentButton');
  if (commentButton) {
    commentButton.addEventListener('click', toggleCommentForm);
  } else {
    console.warn("Element with ID 'commentButton' not found.");
  }

  // 'Cancel' 버튼
  const cancelCommentButton = document.getElementById('cancelCommentButton');
  if (cancelCommentButton) {
    cancelCommentButton.addEventListener('click', toggleCommentForm);
  }

  // 'Submit' 버튼
  const submitCommentButton = document.getElementById('submitCommentButton');
  if (submitCommentButton) {
    submitCommentButton.addEventListener('click', submitComment);
  }

  // 좋아요 버튼
  const likeButton = document.getElementById('likeButton');
  const likeIcon = document.getElementById('likeIcon');

  if (likeButton && likeIcon) {
    // 초기 좋아요 상태 설정
    if (auth.currentUser) {
      checkIfUserLiked(blogId, auth.currentUser.uid).then(liked => {
        isLiked = liked;
        updateLikeButtonUI(isLiked);
      });
    } else {
      isLiked = false;
      updateLikeButtonUI(isLiked);
    }

    likeButton.addEventListener('click', async () => {
      if (auth.currentUser) {
        try {
          if (isLiked) {
            // 좋아요 취소
            await removeLike(blogId, auth.currentUser.uid);
            isLiked = false;
          } else {
            // 좋아요 추가
            await addLike(blogId, auth.currentUser.uid);
            isLiked = true;
          }
          updateLikeButtonUI(isLiked);
        } catch (error) {
          console.error('좋아요 처리 중 오류 발생:', error);
          alert('좋아요를 처리하는 중 오류가 발생했습니다.');
        }
      } else {
        alert('좋아요 기능을 사용하려면 로그인이 필요합니다.');
      }
    });
  } else {
    console.warn("Like button or related elements not found.");
  }

  // 북마크 버튼
  const bookmarkButton = document.getElementById('bookmarkButton');

  if (bookmarkButton) {
    // 초기 북마크 상태 설정
    if (auth.currentUser) {
      checkIfUserBookmarked(blogId, auth.currentUser.uid).then(bookmarked => {
        isBookmarked = bookmarked;
        updateBookmarkButtonUI(isBookmarked);
      });
    }

    bookmarkButton.addEventListener('click', async () => {
      if (auth.currentUser) {
        try {
          if (isBookmarked) {
            // 북마크 해제
            await removeBookmark(blogId, auth.currentUser.uid);
            isBookmarked = false;
          } else {
            // 북마크 추가
            await addBookmark(blogId, auth.currentUser.uid);
            isBookmarked = true;
          }
          updateBookmarkButtonUI(isBookmarked);
        } catch (error) {
          console.error('북마크 처리 중 오류 발생:', error);
          alert('북마크를 처리하는 중 오류가 발생했습니다.');
        }
      } else {
        alert('북마크 기능을 사용하려면 로그인이 필요합니다.');
      }
    });
  } else {
    console.warn("Bookmark button or related elements not found.");
  }

  // 신고 버튼
  const reportButton = document.getElementById('reportButton');
  const reactionReports = document.getElementById('reactionReports');

  if (reportButton && reactionReports) {
    reportButton.addEventListener('click', async () => {
      if (auth.currentUser) {
        try {
          // Firestore에 신고 기록 추가
          const reportRef = doc(db, 'reports', blogId, 'postReports', `${auth.currentUser.uid}_${Date.now()}`);
          await setDoc(reportRef, {
            reporterId: auth.currentUser.uid,
            blogId: blogId,
            createdAt: serverTimestamp(),
          });
          // 'blogs' 컬렉션의 'reports' 필드 1 증가
          await updateDoc(doc(db, 'blogs', blogId), { reports: increment(1) });
          // UI 업데이트
          reactionReports.textContent = parseInt(reactionReports.textContent) + 1;
          alert('신고가 접수되었습니다.');
        } catch (error) {
          console.error('신고 중 오류 발생:', error);
          alert('신고를 처리하는 중 오류가 발생했습니다.');
        }
      } else {
        alert('신고 기능을 사용하려면 로그인이 필요합니다.');
      }
    });
  }
}

// 실시간 업데이트 리스너 설정 함수
function setupRealtimeListeners() {
  // 좋아요 수 실시간 업데이트
  listenToLikes();

  // 북마크 수 실시간 업데이트
  listenToBookmarks();

  // 댓글 수 실시간 업데이트
  listenToCommentsCount();
}

// 좋아요 수를 실시간으로 업데이트하는 함수
function listenToLikes() {
  const blogRef = doc(db, 'blogs', blogId);
  onSnapshot(blogRef, (docSnap) => {
    if (docSnap.exists()) {
      const data = docSnap.data();
      const reactionLikesElem = document.getElementById('reactionLikes');
      if (reactionLikesElem) {
        reactionLikesElem.textContent = data.likes || 0;
      }
    }
  });
}

// 북마크 수를 실시간으로 업데이트하는 함수
function listenToBookmarks() {
  const blogRef = doc(db, 'blogs', blogId);
  onSnapshot(blogRef, (docSnap) => {
    if (docSnap.exists()) {
      const data = docSnap.data();
      const reactionBookmarksElem = document.getElementById('reactionBookmarks');
      if (reactionBookmarksElem) {
        reactionBookmarksElem.textContent = data.bookmarks || 0;
      }
    }
  });
}

// 댓글 수를 실시간으로 업데이트하는 함수
function listenToCommentsCount() {
  const commentsRef = collection(db, 'comments');
  const q = query(commentsRef, where('blogId', '==', blogId));
  onSnapshot(q, (snapshot) => {
    const reactionCommentsElem = document.getElementById('reactionComments');
    if (reactionCommentsElem) {
      reactionCommentsElem.textContent = snapshot.size;
    }
  });
}

// 사용자가 이미 좋아요를 눌렀는지 확인하는 함수
async function checkIfUserLiked(blogId, userId) {
  if (!userId) {
    return false;
  }
  const likeRef = doc(db, 'blogs', blogId, 'likes', userId);
  const likeSnap = await getDoc(likeRef);
  console.log('좋아요 상태:', likeSnap.exists());
  return likeSnap.exists();
}

// 좋아요 추가 함수
async function addLike(blogId, userId) {
  const likeRef = doc(db, 'blogs', blogId, 'likes', userId);
  await setDoc(likeRef, { liked: true });
  // 'blogs' 컬렉션의 'likes' 필드 1 증가
  const blogRef = doc(db, 'blogs', blogId);
  await updateDoc(blogRef, { likes: increment(1) });
}

// 좋아요 제거 함수
async function removeLike(blogId, userId) {
  const likeRef = doc(db, 'blogs', blogId, 'likes', userId);
  await deleteDoc(likeRef);
  // 'blogs' 컬렉션의 'likes' 필드 1 감소
  const blogRef = doc(db, 'blogs', blogId);
  await updateDoc(blogRef, { likes: increment(-1) });
}

// 좋아요 버튼 UI 업데이트 함수
function updateLikeButtonUI(isLiked) {
  const likeIcon = document.getElementById('likeIcon');
  if (likeIcon) {
    if (isLiked) {
      console.log('좋아요 상태: 좋아요 누름');
      likeIcon.classList.add('text-red-500');
      likeIcon.classList.remove('text-[#4c7d9a]');
      // 애니메이션 추가 (선택 사항)
      likeIcon.classList.add('animate-like');
    } else {
      console.log('좋아요 상태: 좋아요 안 누름');
      likeIcon.classList.add('text-[#4c7d9a]');
      likeIcon.classList.remove('text-red-500');
      // 애니메이션 제거
      likeIcon.classList.remove('animate-like');
    }
  }
}

// 사용자가 이미 북마크했는지 확인하는 함수
async function checkIfUserBookmarked(blogId, userId) {
  const bookmarkRef = doc(db, 'bookmarks', userId, 'userBookmarks', blogId);
  const bookmarkSnap = await getDoc(bookmarkRef);
  return bookmarkSnap.exists();
}

// 북마크 추가 함수
async function addBookmark(blogId, userId) {
  const bookmarkRef = doc(db, 'bookmarks', userId, 'userBookmarks', blogId);
  const blogRef = doc(db, 'blogs', blogId);

  // 사용자별 북마크 추가
  await setDoc(bookmarkRef, { bookmarked: true });

  // 'bookmarks' 필드 1 증가
  await updateDoc(blogRef, {
    bookmarks: increment(1),
  });
}

// 북마크 제거 함수
async function removeBookmark(blogId, userId) {
  const bookmarkRef = doc(db, 'bookmarks', userId, 'userBookmarks', blogId);
  const blogRef = doc(db, 'blogs', blogId);

  // 사용자별 북마크 제거
  await deleteDoc(bookmarkRef);

  // 'bookmarks' 필드 1 감소
  await updateDoc(blogRef, {
    bookmarks: increment(-1),
  });
}

// 북마크 버튼 UI 업데이트 함수
function updateBookmarkButtonUI(isBookmarked) {
  const bookmarkIcon = document.querySelector('#bookmarkButton i');
  if (bookmarkIcon) {
    if (isBookmarked) {
      bookmarkIcon.classList.add('text-green-500');
      bookmarkIcon.classList.remove('text-gray-500');
    } else {
      bookmarkIcon.classList.add('text-gray-500');
      bookmarkIcon.classList.remove('text-green-500');
    }
  }
}

// 댓글 작성 폼 토글 함수
function toggleCommentForm() {
  const commentFormContainer = document.getElementById('commentFormContainer');
  if (commentFormContainer) {
    commentFormContainer.classList.toggle('hidden');
  }
}

// 댓글 제출 함수
async function submitComment() {
  const commentInput = document.getElementById('commentInput');
  if (!commentInput) {
    console.warn("Element with ID 'commentInput' not found.");
    return;
  }

  const commentText = commentInput.value.trim();
  if (!commentText) {
    alert('댓글을 입력해주세요.');
    return;
  }

  // 사용자 정보 가져오기
  const currentUser = auth.currentUser;
  if (!currentUser) {
    alert('로그인이 필요합니다.');
    return;
  }

  const userId = currentUser.uid;
  const userName = currentUser.displayName || 'Guest';
  const userPhotoURL = currentUser.photoURL || 'https://via.placeholder.com/30';

  try {
    await addDoc(collection(db, 'comments'), {
      blogId: blogId,
      userId: userId,
      userName: userName,
      userPhotoURL: userPhotoURL,
      text: commentText,
      createdAt: serverTimestamp(),
    });

    // 댓글 작성 후 입력 필드 초기화 및 폼 숨기기
    commentInput.value = '';
    toggleCommentForm();
  } catch (error) {
    console.error('댓글 제출 중 오류 발생:', error);
    alert('댓글을 제출하는 중 오류가 발생했습니다.');
  }
}

// 댓글 목록 로드 함수
function loadComments() {
  const commentsList = document.getElementById('commentsList');
  if (!commentsList) {
    console.warn("Element with ID 'commentsList' not found.");
    return;
  }

  commentsList.innerHTML = '';

  const commentsRef = collection(db, 'comments');
  const q = query(commentsRef, where('blogId', '==', blogId), orderBy('createdAt', 'asc'));

  onSnapshot(q, (querySnapshot) => {
    commentsList.innerHTML = '';

    if (querySnapshot.empty) {
      commentsList.innerHTML = '<p class="text-[#4c7d9a]">댓글이 아직 없습니다. 첫 댓글을 작성해보세요!</p>';
      return;
    }

    querySnapshot.forEach(doc => {
      const comment = doc.data();
      const commentElem = document.createElement('div');
      commentElem.className = 'flex gap-4';

      // 현재 사용자가 댓글 작성자인지 확인
      const isCurrentUser = auth.currentUser && auth.currentUser.uid === comment.userId;

      commentElem.innerHTML = `
        <img src="${comment.userPhotoURL}" alt="${comment.userName}" class="w-10 h-10 rounded-full object-cover">
        <div class="flex-1">
          <div class="flex justify-between items-center">
            <p class="text-[#0d161b] font-semibold">${comment.userName}</p>
            ${isCurrentUser ? `<button class="deleteCommentButton text-red-500 text-sm" data-id="${doc.id}">삭제</button>` : ''}
          </div>
          <p class="text-[#4c7d9a] text-sm">${comment.text}</p>
          <p class="text-[#4c7d9a] text-xs">${getRelativeTimeLabel(getRelativeTime(comment.createdAt))}</p>
        </div>
      `;

      commentsList.appendChild(commentElem);
    });

    // 삭제 버튼 이벤트 리스너 추가
    const deleteButtons = document.querySelectorAll('.deleteCommentButton');
    deleteButtons.forEach(button => {
      button.addEventListener('click', async (e) => {
        const commentId = e.target.getAttribute('data-id');
        if (confirm('댓글을 삭제하시겠습니까?')) {
          try {
            await deleteDoc(doc(db, 'comments', commentId));
            alert('댓글이 삭제되었습니다.');
          } catch (error) {
            console.error('댓글 삭제 중 오류 발생:', error);
            alert('댓글을 삭제하는 중 오류가 발생했습니다.');
          }
        }
      });
    });
  }, (error) => {
    console.error('댓글 목록을 실시간으로 불러오는 중 오류 발생:', error);
    commentsList.innerHTML = '<p class="text-[#4c7d9a]">댓글을 불러오는 데 실패했습니다.</p>';
  });
}

// 상대 시간을 계산하는 함수
function getRelativeTime(timestamp) {
  if (timestamp && timestamp.toDate) {
    return timestamp.toDate();
  } else if (timestamp instanceof Date) {
    return timestamp;
  } else {
    console.warn('Unexpected timestamp format:', timestamp);
    return new Date();
  }
}

// 상대 시간 표현 함수
function getRelativeTimeLabel(pastDate) {
  const now = new Date();
  const diffInSeconds = Math.floor((now - pastDate) / 1000);

  const intervals = [
    { label: '년', seconds: 31536000 },
    { label: '개월', seconds: 2592000 },
    { label: '주', seconds: 604800 },
    { label: '일', seconds: 86400 },
    { label: '시간', seconds: 3600 },
    { label: '분', seconds: 60 },
    { label: '초', seconds: 1 },
  ];

  for (const interval of intervals) {
    const count = Math.floor(diffInSeconds / interval.seconds);
    if (count >= 1) {
      return `${count}${interval.label} 전`;
    }
  }

  return '방금 전';
}

// 읽기 시간 계산 함수
function calculateReadTime(content) {
  const wordsPerMinute = 200;
  const words = content.trim().split(/\s+/).length;
  const minutes = Math.ceil(words / wordsPerMinute);
  return `${minutes} min read`;
}

// 날짜 형식 변환 함수
function formatDate(date) {
  const d = date instanceof Date ? date : date.toDate();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}년 ${month}월 ${day}일`;
}

// 로그인 상태 변경에 따른 처리
auth.onAuthStateChanged(async (user) => {
  if (user) {
    // 좋아요 상태 업데이트
    isLiked = await checkIfUserLiked(blogId, user.uid);
    updateLikeButtonUI(isLiked);

    // 북마크 상태 업데이트
    isBookmarked = await checkIfUserBookmarked(blogId, user.uid);
    updateBookmarkButtonUI(isBookmarked);
  } else {
    isLiked = false;
    isBookmarked = false;
    updateLikeButtonUI(isLiked);
    updateBookmarkButtonUI(isBookmarked);
  }
});

// 페이지 로드 시 초기화 함수 호출
document.addEventListener('DOMContentLoaded', initializePage);
