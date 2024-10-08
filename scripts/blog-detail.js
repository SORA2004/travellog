// scripts/blog-detail.js

import { db, auth } from './firebase.js';
import {
  doc,
  getDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
  addDoc,
  deleteDoc,
  serverTimestamp,
  orderBy,
  onSnapshot,
  setDoc,
  increment, // Firestore SDK에서 한 번만 임포트
} from 'https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js';

// URL에서 blogId 추출
const urlParams = new URLSearchParams(window.location.search);
const blogId = urlParams.get('id'); // URL에 ?id=블로그ID 형태로 전달되어야 함

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
    return { id: docSnap.id, ...data };
  } else {
    throw new Error('해당 블로그 포스트를 찾을 수 없습니다.');
  }
}

// 상대 시간을 계산하는 함수
function getRelativeTime(timestamp) {
  if (timestamp && timestamp.toDate) {
    return timestamp.toDate();
  } else if (timestamp instanceof Date) {
    return timestamp;
  } else {
    console.warn('Unexpected timestamp format:', timestamp);
    return new Date(); // 현재 시간 반환 또는 다른 처리
  }
}

// 상대 시간 표현 함수 (예: "2시간 전")
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

// 조회수 증가 함수
async function incrementViews(id) {
  const docRef = doc(db, 'blogs', id);
  await updateDoc(docRef, {
    views: increment(1),
  });
}

// 댓글 수 계산 함수
async function getCommentsCount(id) {
  const commentsRef = collection(db, 'comments');
  const q = query(commentsRef, where('blogId', '==', id));
  const querySnapshot = await getDocs(q);
  return querySnapshot.size;
}

// 읽기 시간 계산 함수 (예: 분 단위)
function calculateReadTime(content) {
  const wordsPerMinute = 200; // 평균 단어 수
  const words = content.trim().split(/\s+/).length;
  const minutes = Math.ceil(words / wordsPerMinute);
  return `${minutes} min read`;
}

// 날짜 형식 변환 함수 (YYYY년 MM월 DD일)
function formatDate(date) {
  const d = date instanceof Date ? date : date.toDate();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}년 ${month}월 ${day}일`;
}

// 페이지 초기화 함수
async function initializePage() {
  if (!blogId) {
    console.error('블로그 ID가 없습니다.');
    return;
  }

  try {
    const blogPost = await fetchBlogPost(blogId);

    // 디버깅을 위한 콘솔 로그
    console.log('Fetched blog post:', blogPost);

    // 동적 콘텐츠 삽입
    const postTitleElem = document.getElementById('postTitle');
    console.log('postTitleElem:', postTitleElem);
    if (postTitleElem) {
      postTitleElem.textContent = blogPost.title;
    } else {
      console.warn("Element with ID 'postTitle' not found.");
    }

    // <title> 태그 동적 설정
    document.title = `${blogPost.title} - Travellog`;

    const authorName = blogPost.authorName;
    const createdAt = blogPost.createdAt;
    const readTime = calculateReadTime(blogPost.content);

    const createdAtDate = getRelativeTime(createdAt);
    const postMeta = `작성자: ${authorName} | 작성일: ${getRelativeTimeLabel(createdAtDate)}`;
    const postMetaElem = document.getElementById('postMeta');
    if (postMetaElem) {
      postMetaElem.textContent = postMeta;
    } else {
      console.warn("Element with ID 'postMeta' not found.");
    }

    const postViewsElem = document.getElementById('postViews');
    if (postViewsElem) {
      postViewsElem.textContent = blogPost.views || 0;
    } else {
      console.warn("Element with ID 'postViews' not found.");
    }

    const postLikesElem = document.getElementById('postLikes');
    if (postLikesElem) {
      postLikesElem.textContent = blogPost.likes || 0;
    } else {
      console.warn("Element with ID 'postLikes' not found.");
    }

    // Destinations 설정 (location 필드 사용)
    const postDestinationsElem = document.getElementById('postDestinations');
    if (postDestinationsElem) {
      postDestinationsElem.textContent = Array.isArray(blogPost.location) ? blogPost.location.join(', ') : blogPost.location || '-';
    } else {
      console.warn("Element with ID 'postDestinations' not found.");
    }

    // Travel Periods 설정 (startDate ~ endDate)
    const postTravelPeriodsElem = document.getElementById('postTravelPeriods');
    if (postTravelPeriodsElem) {
      postTravelPeriodsElem.textContent = (blogPost.startDate && blogPost.endDate) 
        ? `${formatDate(blogPost.startDate)} ~ ${formatDate(blogPost.endDate)}`
        : '-';
    } else {
      console.warn("Element with ID 'postTravelPeriods' not found.");
    }

    const postContentElem = document.getElementById('postContent');
    if (postContentElem) {
      postContentElem.innerHTML = blogPost.content || '';
    } else {
      console.warn("Element with ID 'postContent' not found.");
    }

    const postAdditionalContentElem = document.getElementById('postAdditionalContent');
    if (postAdditionalContentElem) {
      postAdditionalContentElem.innerHTML = blogPost.additionalContent || '';
    } else {
      console.warn("Element with ID 'postAdditionalContent' not found.");
    }

    // 커버 이미지 설정
    const coverImageContainer = document.getElementById('coverImageContainer');
    if (coverImageContainer) {
      const coverImageURL = blogPost.coverImageURL || 'https://via.placeholder.com/1200x600'; // 기본 이미지 설정
      coverImageContainer.style.backgroundImage = `linear-gradient(rgba(0, 0, 0, 0.1) 0%, rgba(0, 0, 0, 0.4) 100%), url("${coverImageURL}")`;

      // 이미지 로딩 오류 처리 (선택 사항)
      const img = new Image();
      img.src = coverImageURL;
      img.onerror = () => {
        coverImageContainer.style.backgroundImage = `linear-gradient(rgba(0, 0, 0, 0.1) 0%, rgba(0, 0, 0, 0.4) 100%), url("https://via.placeholder.com/1200x600")`;
      };
    } else {
      console.warn("Element with ID 'coverImageContainer' not found.");
    }

    // 태그 삽입
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

    // "여러 표현들" 섹션 삽입
    const reactionLikesElem = document.getElementById('reactionLikes');
    if (reactionLikesElem) {
      reactionLikesElem.textContent = blogPost.likes || 0;
    } else {
      console.warn("Element with ID 'reactionLikes' not found.");
    }

    const reactionCommentsElem = document.getElementById('reactionComments');
    if (reactionCommentsElem) {
      const commentsCount = await getCommentsCount(blogId);
      reactionCommentsElem.textContent = commentsCount;
    } else {
      console.warn("Element with ID 'reactionComments' not found.");
    }

    const reactionBookmarksElem = document.getElementById('reactionBookmarks');
    if (reactionBookmarksElem) {
      reactionBookmarksElem.textContent = blogPost.bookmarks || 0; // bookmarks 필드가 있을 경우
    } else {
      console.warn("Element with ID 'reactionBookmarks' not found.");
    }

    const reactionReportsElem = document.getElementById('reactionReports');
    if (reactionReportsElem) {
      reactionReportsElem.textContent = blogPost.reports || 0; // reports 필드가 있을 경우
    } else {
      console.warn("Element with ID 'reactionReports' not found.");
    }

    // 조회수 증가
    await incrementViews(blogId);

    // 댓글 목록 불러오기
    loadComments(); // onSnapshot을 사용하여 실시간 업데이트

    // 'Comment' 버튼 이벤트 리스너 추가
    const commentButton = document.getElementById('commentButton');
    if (commentButton) {
      commentButton.addEventListener('click', toggleCommentForm);
    } else {
      console.warn("Element with ID 'commentButton' not found.");
    }

    // 'Cancel' 버튼 이벤트 리스너 추가
    const cancelCommentButton = document.getElementById('cancelCommentButton');
    if (cancelCommentButton) {
      cancelCommentButton.addEventListener('click', toggleCommentForm);
    }

    // 'Submit' 버튼 이벤트 리스너 추가
    const submitCommentButton = document.getElementById('submitCommentButton');
    if (submitCommentButton) {
      submitCommentButton.addEventListener('click', submitComment);
    }

    // 좋아요 버튼 이벤트 리스너 추가
    const likeButton = document.getElementById('likeButton');
    const reactionLikes = document.getElementById('reactionLikes');

    if (likeButton && reactionLikes) {
      likeButton.addEventListener('click', async () => {
        if (auth.currentUser) {
          try {
            // Firestore에서 현재 사용자가 이미 좋아요를 눌렀는지 확인
            const likeRef = doc(db, 'likes', blogId, 'userLikes', auth.currentUser.uid);
            const likeSnap = await getDoc(likeRef);

            if (!likeSnap.exists()) {
              // 좋아요 추가
              await setDoc(likeRef, { liked: true });
              // 'blogs' 컬렉션의 'likes' 필드 1 증가
              await updateDoc(doc(db, 'blogs', blogId), { likes: increment(1) });
              // UI 업데이트
              reactionLikes.textContent = parseInt(reactionLikes.textContent) + 1;
              alert('좋아요를 추가했습니다.');
            } else {
              alert('이미 좋아요를 눌렀습니다.');
            }
          } catch (error) {
            console.error('좋아요 추가 중 오류 발생:', error);
            alert('좋아요를 추가하는 중 오류가 발생했습니다.');
          }
        } else {
          alert('좋아요 기능을 사용하려면 로그인이 필요합니다.');
        }
      });
    }

    // 북마크 버튼 이벤트 리스너 추가
    const bookmarkButton = document.getElementById('bookmarkButton');
    const reactionBookmarks = document.getElementById('reactionBookmarks');

    if (bookmarkButton && reactionBookmarks) {
      bookmarkButton.addEventListener('click', async () => {
        if (auth.currentUser) {
          try {
            // Firestore에서 현재 사용자가 이미 북마크를 눌렀는지 확인
            const bookmarkRef = doc(db, 'bookmarks', auth.currentUser.uid, 'userBookmarks', blogId);
            const bookmarkSnap = await getDoc(bookmarkRef);

            if (!bookmarkSnap.exists()) {
              // 북마크 추가
              await setDoc(bookmarkRef, { bookmarked: true });
              // 'blogs' 컬렉션의 'bookmarks' 필드 1 증가
              await updateDoc(doc(db, 'blogs', blogId), { bookmarks: increment(1) });
              // UI 업데이트
              reactionBookmarks.textContent = parseInt(reactionBookmarks.textContent) + 1;
              alert('북마크를 추가했습니다.');
            } else {
              alert('이미 북마크를 눌렀습니다.');
            }
          } catch (error) {
            console.error('북마크 추가 중 오류 발생:', error);
            alert('북마크를 추가하는 중 오류가 발생했습니다.');
          }
        } else {
          alert('북마크 기능을 사용하려면 로그인이 필요합니다.');
        }
      });
    }

    // 신고 버튼 이벤트 리스너 추가
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
              createdAt: serverTimestamp()
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

  } catch (error) {
    console.error(error);
    alert('블로그 포스트를 불러오는 데 실패했습니다.');
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

// 댓글 목록 로드 함수 (실시간 업데이트)
function loadComments() {
  const commentsList = document.getElementById('commentsList');
  if (!commentsList) {
    console.warn("Element with ID 'commentsList' not found.");
    return;
  }

  commentsList.innerHTML = ''; // 기존 댓글 목록 초기화

  const commentsRef = collection(db, 'comments');
  const q = query(commentsRef, where('blogId', '==', blogId), orderBy('createdAt', 'asc'));

  onSnapshot(q, (querySnapshot) => {
    commentsList.innerHTML = ''; // 기존 댓글 목록 초기화

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

// 페이지 로드 시 실행
document.addEventListener('DOMContentLoaded', initializePage);
