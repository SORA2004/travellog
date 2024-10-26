// scripts/header.js

import {
  auth,
  provider,
  signInWithPopup,
  signInAnonymously,
  signOut,
  monitorAuthState,
} from './firebase.js';

document.addEventListener('DOMContentLoaded', () => {
  const headerElement = document.querySelector('header');

  // 헤더 로드 함수
  async function loadLayout() {
    try {
      const headerResponse = await fetch('header.html');
      if (!headerResponse.ok) throw new Error(`헤더 로드 오류! 상태: ${headerResponse.status}`);
      const headerHTML = await headerResponse.text();
      headerElement.innerHTML = headerHTML;
      console.log('헤더가 성공적으로 로드되었습니다.');
      initializeHeaderFeatures();
    } catch (error) {
      console.error('헤더 로드 중 오류 발생:', error);
    }
  }

  // 기능 초기화 함수
  function initializeHeaderFeatures() {
    const modal = document.getElementById('loginModal');
    const modalOverlay = document.getElementById('modalOverlay');
    const closeModalBtn = document.getElementById('closeLoginModal');
    const googleLoginButton = document.getElementById('google-login-btn');
    const anonymousLoginButton = document.getElementById('anonymous-login-btn');
    const openLoginModalButton = document.getElementById('openLoginModal');
    const logoutButton = document.getElementById('logoutButton');
    const logoutButtonDropdown = document.getElementById('logoutButtonDropdown');
    const userProfile = document.getElementById('userProfile');
    const profileDropdown = document.getElementById('profileDropdown');

    console.log('initializeHeaderFeatures가 실행되었습니다.');

    // 로그인 모달 열기
    if (openLoginModalButton) {
      openLoginModalButton.addEventListener('click', (e) => {
        e.preventDefault();
        if (modal && modalOverlay) {
          modal.classList.remove('hidden');
          modalOverlay.classList.remove('hidden');
          console.log('로그인 모달이 표시되었습니다.');
        }
      });
    }

    // 로그인 모달 닫기
    if (closeModalBtn) {
      closeModalBtn.addEventListener('click', () => {
        if (modal && modalOverlay) {
          modal.classList.add('hidden');
          modalOverlay.classList.add('hidden');
          console.log('로그인 모달이 닫혔습니다.');
        }
      });
    }

    // 모달 외부 클릭 시 모달 닫기
    if (modalOverlay) {
      modalOverlay.addEventListener('click', () => {
        if (modal && modalOverlay) {
          modal.classList.add('hidden');
          modalOverlay.classList.add('hidden');
          console.log('모달 오버레이를 클릭하여 로그인 모달이 닫혔습니다.');
        }
      });
    }

    // Google 로그인 처리
    if (googleLoginButton) {
      googleLoginButton.addEventListener('click', async () => {
        try {
          await signInWithPopup(auth, provider);
          console.log('Google 로그인이 성공적으로 완료되었습니다.');
          // 인증 상태 변화에 따라 모달이 자동으로 닫힙니다.
        } catch (error) {
          console.error('Google 로그인 실패:', error);
          alert('Google 로그인 실패: ' + error.message);
        }
      });
      console.log('Google 로그인 버튼 이벤트 리스너가 추가되었습니다.');
    }

    // 익명 로그인 처리
    if (anonymousLoginButton) {
      anonymousLoginButton.addEventListener('click', async () => {
        try {
          await signInAnonymously(auth);
          console.log('익명 로그인이 성공적으로 완료되었습니다.');
          // 인증 상태 변화에 따라 모달이 자동으로 닫힙니다.
        } catch (error) {
          console.error('익명 로그인 실패:', error);
          alert('익명 로그인 실패: ' + error.message);
        }
      });
      console.log('익명 로그인 버튼 이벤트 리스너가 추가되었습니다.');
    }

    // 로그아웃 처리
    async function handleLogout() {
      try {
        await signOut(auth);
        alert('로그아웃 되었습니다.');
        console.log('사용자가 로그아웃했습니다.');
      } catch (error) {
        console.error('로그아웃 실패:', error);
        alert('로그아웃 실패: ' + error.message);
      }
    }

    // 로그아웃 버튼 클릭 이벤트
    if (logoutButton) {
      logoutButton.addEventListener('click', async () => {
        await handleLogout();
      });
      console.log('로그아웃 버튼 이벤트 리스너가 추가되었습니다.');
    }

    // 로그아웃 드롭다운 버튼 클릭 이벤트
    if (logoutButtonDropdown) {
      logoutButtonDropdown.addEventListener('click', async () => {
        await handleLogout();
      });
      console.log('로그아웃 드롭다운 버튼 이벤트 리스너가 추가되었습니다.');
    }

    // 인증 상태 변화 감지
    monitorAuthState((user) => {
      console.log('사용자 인증 상태가 변경되었습니다.', user);
      if (user) {
        hideLoginButton(); // 로그인 버튼 숨기기
        showUserProfile(user); // 사용자 프로필 표시
        if (modal && modalOverlay) {
          modal.classList.add('hidden');
          modalOverlay.classList.add('hidden');
          console.log('모달과 오버레이가 숨겨졌습니다.');
        }
      } else {
        showLoginButton(); // 로그인 버튼 표시
        hideUserProfile(); // 사용자 프로필 숨기기
        if (modal && modalOverlay) {
          modal.classList.add('hidden');
          modalOverlay.classList.add('hidden');
          console.log('모달과 오버레이가 숨겨졌습니다.');
        }
      }
    });

    // 사용자 프로필 표시 함수
    function showUserProfile(user) {
      userProfile.classList.remove('hidden');
      displayUserProfile(user);
      console.log('사용자 프로필이 표시되었습니다.');
    }

    // 사용자 프로필 숨기기 함수
    function hideUserProfile() {
      userProfile.classList.add('hidden');
      profileDropdown.classList.add('hidden');
      console.log('사용자 프로필이 숨겨졌습니다.');
    }

    // 로그인 버튼 표시 (동적 생성)
    function showLoginButton() {
      // 이미 존재하는 로그인 버튼이 있는지 확인
      if (document.getElementById('dynamicLoginButton')) {
        console.log('이미 동적 로그인 버튼이 존재합니다.');
        return;
      }

      const navLinks = headerElement.querySelector('.nav-links.flex');
      if (navLinks) {
        const loginButton = document.createElement('a');
        loginButton.href = '#';
        loginButton.id = 'dynamicLoginButton';
        loginButton.className = 'nav-link text-blue-500 hover:underline';
        loginButton.textContent = '로그인';
        loginButton.addEventListener('click', (e) => {
          e.preventDefault();
          console.log('동적 로그인 버튼이 클릭되었습니다.');
          if (modal && modalOverlay) {
            modal.classList.remove('hidden');
            modalOverlay.classList.remove('hidden');
            console.log('로그인 모달이 표시되었습니다.');
          }
        });
        navLinks.appendChild(loginButton);
        console.log('동적 로그인 버튼이 추가되었습니다.');
      } else {
        console.error('nav-links.flex 요소를 찾을 수 없습니다.');
      }
    }

    // 로그인 버튼 숨기기 (동적 생성된 로그인 버튼 제거)
    function hideLoginButton() {
      const dynamicLoginButton = document.getElementById('dynamicLoginButton');
      if (dynamicLoginButton) {
        dynamicLoginButton.remove();
        console.log('동적 로그인 버튼이 제거되었습니다.');
      }
      // 기존 로그인 버튼 숨기기 (고정된 로그인 버튼이 있다면)
      const openLoginModalButton = document.getElementById('openLoginModal');
      if (openLoginModalButton) {
        openLoginModalButton.classList.add('hidden');
        console.log('고정 로그인 버튼이 숨겨졌습니다.');
      }
    }

    // 사용자 프로필 정보 표시 함수
    function displayUserProfile(user) {
      const userPhoto = document.getElementById('userPhoto');
      const userName = document.getElementById('userName');
      if (userPhoto) {
        userPhoto.src = user.photoURL || 'https://via.placeholder.com/150';
        console.log('사용자 프로필 사진이 업데이트되었습니다.');
      }
      if (userName) {
        userName.textContent = user.displayName || '익명 사용자';
        console.log('사용자 이름이 업데이트되었습니다.');
      }
    }
  }

  // 레이아웃 로드 실행
  loadLayout();
});
