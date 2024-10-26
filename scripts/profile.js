// scripts/profile.js

import { auth, db, storage } from './firebase.js';
import {
  updateProfile,
  signOut,
  deleteUser,
  reauthenticateWithCredential,
  EmailAuthProvider,
  onAuthStateChanged,
} from 'https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js';
import {
  ref,
  uploadBytes,
  getDownloadURL,
} from 'https://www.gstatic.com/firebasejs/9.22.2/firebase-storage.js';
import {
  collection,
  query,
  where,
  getDocs,
  orderBy,
  deleteDoc,
  doc,
  updateDoc,
  increment,
  getDoc,
} from 'https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js';

// 현재 사용자 저장을 위한 변수
let currentUser = null;

// 로그아웃 여부를 추적하기 위한 변수
let isLoggingOut = false;

// DOMContentLoaded 이벤트 리스너
document.addEventListener('DOMContentLoaded', () => {
  const profileNameElem = document.getElementById('profileName');
  const profileEmailElem = document.getElementById('profileEmail');
  const profileImageContainer = document.getElementById('profileImageContainer');
  const editProfileButton = document.getElementById('editProfileButton');
  const profileImageInput = document.getElementById('profileImageInput');
  const deleteAccountButton = document.getElementById('deleteAccountButton');
  const logoutButton = document.getElementById('logoutButton');
  const userBlogsContainer = document.getElementById('userBlogsContainer');
  const userBookmarksContainer = document.getElementById('userBookmarksContainer'); // 북마크 컨테이너

  // 로그인 상태 확인 및 사용자 정보 로드
  onAuthStateChanged(auth, async (user) => {
    if (user) {
      currentUser = user;
      loadUserProfile(user);
      await loadUserBlogs(user);
      await loadUserBookmarks(user); // 북마크된 블로그 로드
    } else {
      // 로그아웃 중인 경우에는 알림을 표시하지 않음
      if (!isLoggingOut) {
        alert('로그인이 필요합니다.');
        window.location.href = 'index.html'; // 로그인 페이지로 리디렉션
      }
    }
  });

  // 로그아웃 버튼 클릭 시
  if (logoutButton) {
    logoutButton.addEventListener('click', async () => {
      try {
        isLoggingOut = true; // 로그아웃 시작
        await signOut(auth);
        alert('로그아웃 되었습니다.');
        window.location.href = 'index.html';
      } catch (error) {
        console.error('로그아웃 실패:', error);
        alert('로그아웃에 실패했습니다.');
      } finally {
        isLoggingOut = false; // 로그아웃 종료
      }
    });
  }

  // 사용자 프로필 정보 로드 함수
  function loadUserProfile(user) {
    const displayName = user.displayName || '익명 사용자';
    const email = user.email || '이메일 없음';
    let photoURL;

    // 익명 로그인인지 확인
    if (user.isAnonymous) {
      // 익명 로그인인 경우 사람 아이콘 사용
      photoURL = 'images/person-icon.png'; // 사람 아이콘 이미지 경로
    } else {
      // 익명 로그인이 아닌 경우 photoURL 사용
      photoURL =
        user.photoURL ||
        'https://cdn.usegalileo.ai/stability/29274efa-9547-4ca7-b2af-b18a22f9456e.png';
    }

    // 프로필 이미지 설정
    if (profileImageContainer) {
      profileImageContainer.style.backgroundImage = `url("${photoURL}")`;
    } else {
      console.error('프로필 이미지 컨테이너를 찾을 수 없습니다.');
    }

    // 사용자 이름 및 이메일 설정
    if (profileNameElem) {
      profileNameElem.textContent = displayName;
    } else {
      console.error('프로필 이름 요소를 찾을 수 없습니다.');
    }

    if (profileEmailElem) {
      profileEmailElem.textContent = email;
    } else {
      console.error('프로필 이메일 요소를 찾을 수 없습니다.');
    }

    // 헤더의 프로필 사진, 이름, 이메일 설정
    const userPhoto = document.getElementById('userPhoto');
    const userName = document.getElementById('userName');
    const userEmailElem = document.getElementById('userEmail');

    if (userPhoto) {
      userPhoto.src = photoURL;
    } else {
      console.warn('헤더 프로필 사진 요소를 찾을 수 없습니다.');
    }

    if (userName) {
      userName.textContent = displayName;
    } else {
      console.warn('헤더 사용자 이름 요소를 찾을 수 없습니다.');
    }

    if (userEmailElem) {
      userEmailElem.textContent = email;
    } else {
      console.warn('헤더 사용자 이메일 요소를 찾을 수 없습니다.');
    }
  }

  // 사용자 블로그 로드 함수
  async function loadUserBlogs(user) {
    if (!userBlogsContainer) {
      console.error('사용자 블로그 컨테이너를 찾을 수 없습니다.');
      return;
    }

    // 기존 블로그 목록을 초기화
    userBlogsContainer.innerHTML = '';

    const q = query(
      collection(db, 'blogs'),
      where('authorId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    try {
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        userBlogsContainer.innerHTML = '<p class="text-[#4c7d9a]">작성한 블로그가 없습니다.</p>';
        return;
      }

      querySnapshot.forEach((docSnap) => {
        const blog = docSnap.data();
        const blogCard = document.createElement('div');
        blogCard.className = 'blog-card bg-white p-4 rounded shadow mb-4 flex';

        blogCard.innerHTML = `
          <img src="${blog.coverImageURL || 'https://via.placeholder.com/150'}" alt="블로그 커버 사진" class="w-24 h-24 object-cover rounded mr-4">
          <div class="blog-info flex-1">
            <h4 class="text-lg font-bold">${blog.title}</h4>
            <p class="text-sm text-gray-600">${blog.summary}</p>
            <div class="mt-2 flex gap-2">
              <button onclick="location.href='blog-detail.html?id=${docSnap.id}'" class="text-blue-500 hover:underline">더 보기</button>
              <button class="deleteBlogButton text-sm text-white bg-red-500 px-2 py-1 rounded" data-id="${docSnap.id}">삭제</button>
            </div>
          </div>
        `;
        userBlogsContainer.appendChild(blogCard);
      });

      // 블로그 삭제 기능 추가
      const deleteButtons = userBlogsContainer.querySelectorAll('.deleteBlogButton');
      deleteButtons.forEach((button) => {
        button.addEventListener('click', async (e) => {
          const blogId = e.target.getAttribute('data-id');
          if (confirm('이 블로그를 삭제하시겠습니까?')) {
            try {
              await deleteDoc(doc(db, 'blogs', blogId));
              alert('블로그가 삭제되었습니다.');
              loadUserBlogs(currentUser); // 블로그 목록 갱신
            } catch (error) {
              console.error('블로그 삭제 중 오류 발생:', error);
              alert('블로그를 삭제하는 중 오류가 발생했습니다.');
            }
          }
        });
      });

    } catch (error) {
      console.error('사용자 블로그 가져오기 오류:', error);
      userBlogsContainer.innerHTML = '<p>블로그를 불러오는 중 오류가 발생했습니다.</p>';
    }
  }

  // 사용자 북마크 로드 함수
  async function loadUserBookmarks(user) {
    if (!userBookmarksContainer) {
      console.error('사용자 북마크 컨테이너를 찾을 수 없습니다.');
      return;
    }

    // 기존 북마크 목록을 초기화
    userBookmarksContainer.innerHTML = '';

    const bookmarksRef = collection(db, 'bookmarks', user.uid, 'userBookmarks');
    try {
      const bookmarkSnapshot = await getDocs(bookmarksRef);

      if (bookmarkSnapshot.empty) {
        userBookmarksContainer.innerHTML =
          '<p class="text-[#4c7d9a]">북마크한 블로그가 없습니다.</p>';
        return;
      }

      const blogPromises = [];
      bookmarkSnapshot.forEach((docSnap) => {
        const blogId = docSnap.id;
        blogPromises.push(getDoc(doc(db, 'blogs', blogId)));
      });

      const blogSnapshots = await Promise.all(blogPromises);

      blogSnapshots.forEach((docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          const blogCard = document.createElement('div');
          blogCard.className = 'blog-card bg-white p-4 rounded shadow mb-4 flex';

          blogCard.innerHTML = `
            <img src="${data.coverImageURL || 'https://via.placeholder.com/150'}" alt="블로그 커버 사진" class="w-24 h-24 object-cover rounded mr-4">
            <div class="blog-info flex-1">
              <h4 class="text-lg font-bold">${data.title}</h4>
              <p class="text-sm text-gray-600 mt-2">${data.summary}</p>
              <div class="mt-2 flex gap-2">
                <button onclick="location.href='blog-detail.html?id=${docSnap.id}'" class="text-blue-500 hover:underline">더 보기</button>
                <button class="removeBookmarkButton text-sm text-white bg-red-500 px-2 py-1 rounded" data-id="${docSnap.id}">북마크 해제</button>
              </div>
            </div>
          `;

          userBookmarksContainer.appendChild(blogCard);
        }
      });

      // 북마크 해제 기능 추가
      const removeButtons = userBookmarksContainer.querySelectorAll('.removeBookmarkButton');
      removeButtons.forEach((button) => {
        button.addEventListener('click', async (e) => {
          const blogId = e.target.getAttribute('data-id');
          if (confirm('이 블로그를 북마크에서 해제하시겠습니까?')) {
            try {
              // 북마크 문서 삭제
              await deleteDoc(doc(db, 'bookmarks', user.uid, 'userBookmarks', blogId));
              // 'blogs' 컬렉션의 'bookmarks' 필드 감소
              const blogRef = doc(db, 'blogs', blogId);
              await updateDoc(blogRef, { bookmarks: increment(-1) });
              alert('북마크가 해제되었습니다.');
              loadUserBookmarks(currentUser); // 북마크 목록 갱신
            } catch (error) {
              console.error('북마크 해제 중 오류 발생:', error);
              alert('북마크를 해제하는 중 오류가 발생했습니다.');
            }
          }
        });
      });
    } catch (error) {
      console.error('북마크 가져오기 오류:', error);
      userBookmarksContainer.innerHTML = '<p>북마크를 불러오는 중 오류가 발생했습니다.</p>';
    }
  }

  // 프로필 이미지 변경 기능
  if (editProfileButton && profileImageInput) {
    editProfileButton.addEventListener('click', () => {
      profileImageInput.click();
    });

    profileImageInput.addEventListener('change', async (event) => {
      const file = event.target.files[0];
      if (file) {
        try {
          // 파일 형식 확인
          if (!file.type.startsWith('image/')) {
            alert('이미지 파일만 업로드할 수 있습니다.');
            return;
          }
          // 파일 크기 제한 (예: 2MB)
          const maxSize = 2 * 1024 * 1024; // 2MB
          if (file.size > maxSize) {
            alert('이미지 파일 크기는 2MB를 초과할 수 없습니다.');
            return;
          }

          // Firebase Storage에 이미지 업로드
          const storageRef = ref(
            storage,
            `profile-images/${auth.currentUser.uid}/${file.name}_${Date.now()}`
          );
          const snapshot = await uploadBytes(storageRef, file);
          const downloadURL = await getDownloadURL(snapshot.ref);
          console.log('이미지가 업로드되었습니다:', downloadURL);

          // Firebase Authentication 프로필 업데이트
          await updateProfile(auth.currentUser, {
            photoURL: downloadURL,
          });

          // UI 업데이트
          if (profileImageContainer) {
            profileImageContainer.style.backgroundImage = `url("${downloadURL}")`;
          }

          // 헤더의 프로필 사진도 업데이트
          const userPhoto = document.getElementById('userPhoto');
          if (userPhoto) {
            userPhoto.src = downloadURL;
          }

          alert('프로필 사진이 성공적으로 업데이트되었습니다!');
        } catch (error) {
          console.error('프로필 사진 업데이트 중 오류 발생:', error);
          alert('프로필 사진을 업데이트하는 중 오류가 발생했습니다. 다시 시도해주세요.');
        }
      }
    });
  }

  // 계정 삭제 기능
  if (deleteAccountButton) {
    deleteAccountButton.addEventListener('click', async () => {
      const confirmDelete = confirm(
        '정말로 계정을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.'
      );

      if (confirmDelete) {
        const user = auth.currentUser;

        if (user) {
          try {
            // 재인증 로직 추가 (필요한 경우)
            if (user.email) {
              const password = prompt('계정을 삭제하려면 비밀번호를 입력해주세요.');

              if (password) {
                const credential = EmailAuthProvider.credential(user.email, password);

                // 재인증 수행
                await reauthenticateWithCredential(user, credential);

                // Firestore에서 사용자 데이터 삭제 (필요한 경우)
                await deleteDoc(doc(db, 'users', user.uid));

                // Firebase Authentication에서 사용자 계정 삭제
                await deleteUser(user);

                alert('계정이 성공적으로 삭제되었습니다.');
                window.location.href = 'index.html';
              } else {
                alert('비밀번호를 입력해야 계정 삭제가 가능합니다.');
              }
            } else {
              // Google 또는 기타 제공자로 로그인한 경우
              alert('계정을 삭제하려면 다시 로그인해야 합니다. 로그아웃 후 다시 로그인해주세요.');
              await signOut(auth);
              window.location.href = 'index.html';
            }
          } catch (error) {
            console.error('계정 삭제 중 오류 발생:', error);

            if (error.code === 'auth/wrong-password') {
              alert('비밀번호가 올바르지 않습니다. 다시 시도해주세요.');
            } else if (error.code === 'auth/requires-recent-login') {
              alert('보안을 위해 최근에 다시 로그인해야 합니다. 다시 로그인 후 시도해주세요.');
              await signOut(auth);
              window.location.href = 'index.html';
            } else {
              alert('계정 삭제 중 오류가 발생했습니다. 다시 시도해주세요.');
            }
          }
        } else {
          alert('로그인된 사용자가 없습니다.');
        }
      }
    });
  }
});
