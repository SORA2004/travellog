// scripts/header.js

import { auth, provider, signInWithPopup, signInAnonymously, signOut, monitorAuthState } from './firebase.js';

document.addEventListener('DOMContentLoaded', () => {
  const modal = document.getElementById('loginModal');
  const modalOverlay = document.getElementById('modalOverlay');
  const loginButton = document.getElementById('openLoginModal');
  const closeModal = document.getElementsByClassName('close')[0];
  const googleLoginButton = document.getElementById('google-login-btn');
  const guestLoginButton = document.getElementById('anonymous-login-btn');
  const userProfile = document.getElementById('userProfile');
  const myTravelLogButton = document.getElementById('myTravelLogButton');
  const logoutButton = document.getElementById('logoutButton');

  // 로그인 상태 업데이트
  monitorAuthState((user) => {
    if (user) {
      loginButton.style.display = 'none';
      userProfile.style.display = 'flex';
      displayUserProfile(user);
      if (modal && modalOverlay) {
        modal.style.display = 'none';
        modalOverlay.style.display = 'none';
      }
    } else {
      loginButton.style.display = 'block';
      userProfile.style.display = 'none';
    }
  });

  // 로그인 버튼 클릭 시 모달 열기
  if (loginButton) {
    loginButton.addEventListener('click', (e) => {
      e.preventDefault();
      modal.style.display = 'block';
      modalOverlay.style.display = 'block';
    });
  }

  // 로그아웃 버튼 클릭 시
  if (logoutButton) {
    logoutButton.addEventListener('click', async () => {
      try {
        await signOut(auth);
        alert('로그아웃 되었습니다.');
      } catch (error) {
        console.error('로그아웃 실패: ', error);
        alert('로그아웃 실패: ' + error.message);
      }
    });
  }

  // 모달 닫기 버튼
  if (closeModal) {
    closeModal.addEventListener('click', () => {
      modal.style.display = 'none';
      modalOverlay.style.display = 'none';
    });
  }

  // 모달 외부 클릭 시 모달 닫기
  window.addEventListener('click', (event) => {
    if (event.target === modalOverlay) {
      modal.style.display = 'none';
      modalOverlay.style.display = 'none';
    }
  });

  // Google 로그인 처리
  if (googleLoginButton) {
    googleLoginButton.addEventListener('click', async () => {
      try {
        await signInWithPopup(auth, provider);
      } catch (error) {
        console.error('Google 로그인 실패: ', error);
        alert('Google 로그인 실패: ' + error.message);
      }
    });
  }

  // 익명 로그인 처리
  if (guestLoginButton) {
    guestLoginButton.addEventListener('click', async () => {
      try {
        await signInAnonymously(auth);
      } catch (error) {
        console.error('게스트 로그인 실패: ', error);
        alert('게스트 로그인 실패: ' + error.message);
      }
    });
  }

  // '나의 여행로그쓰기' 버튼 클릭 이벤트
  if (myTravelLogButton) {
    myTravelLogButton.addEventListener('click', (e) => {
      e.preventDefault(); // 기본 링크 동작을 막음

      // Firebase 로그인 상태 확인
      const user = auth.currentUser;
      if (user) {
        // 로그인이 되어 있으면 'addblog.html' 페이지로 이동
        window.location.href = 'addblog.html';
      } else {
        // 로그인이 되어 있지 않으면 모달 창을 띄움
        modal.style.display = 'block';
        modalOverlay.style.display = 'block';
      }
    });
  }

  function displayUserProfile(user) {
    const userPhoto = document.getElementById('userPhoto');
    const userName = document.getElementById('userName');
    if (userPhoto) userPhoto.src = user.photoURL || 'https://via.placeholder.com/30';
    if (userName) userName.textContent = user.displayName || '사용자';
  }
});
