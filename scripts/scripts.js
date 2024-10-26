// scripts/scripts.js

import { auth, provider, signInWithPopup, signInAnonymously } from './firebase.js'; // Firebase 모듈 가져오기

document.addEventListener("DOMContentLoaded", () => {
    const modal = document.getElementById("loginModal");
    const modalOverlay = document.getElementById("modalOverlay");
    const closeModal = document.getElementsByClassName("close")[0];
    const googleLoginButton = document.getElementById("google-login-btn");
    const guestLoginButton = document.getElementById("anonymous-login-btn");
    const loginButton = document.getElementById("openLoginModal"); // loginButton을 먼저 선언
    const userProfile = document.getElementById("userProfile");
    const myTravelLogButton = document.getElementById('myTravelLogButton');

    // '로그인' 버튼 클릭 이벤트
    loginButton.addEventListener("click", (e) => {
        e.preventDefault();
        modal.style.display = "block";
        modalOverlay.style.display = "block";
    });
	
    // '나의 여행로그쓰기' 버튼 클릭 이벤트
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
    
    // 모달 닫기 버튼 (X) 기능
    closeModal.addEventListener("click", () => {
        modal.style.display = "none";
        modalOverlay.style.display = "none";
    });

    // 모달 외부 클릭 시 모달 닫기
    window.addEventListener("click", (event) => {
        if (event.target === modalOverlay) {
            modal.style.display = "none";
            modalOverlay.style.display = "none";
        }
    });

    // Google 로그인 버튼 클릭 시
googleLoginButton.addEventListener("click", async () => {
    try {
        const result = await signInWithPopup(auth, provider);
        loginButton.style.display = "none";
        userProfile.style.display = "flex";
        displayUserProfile(result.user);
        // 로그인 후 모달 닫기
        modal.style.display = "none";
        modalOverlay.style.display = "none";
    } catch (error) {
        console.error("Google 로그인 실패: ", error);
        alert("Google 로그인 실패: " + error.message);
    }
});

    // 익명 로그인 버튼 클릭 시
    guestLoginButton.addEventListener("click", async () => {
        try {
            await signInAnonymously(auth);
            loginButton.style.display = "none";
            userProfile.style.display = "flex";
            displayGuestProfile();
            // 로그인 후 모달 닫기
            modal.style.display = "none";
            modalOverlay.style.display = "none";
        } catch (error) {
            console.error("게스트 로그인 실패: ", error);
            alert("게스트 로그인 실패: " + error.message);
        }
    });

    // Firebase 인증 상태 감지
    auth.onAuthStateChanged(user => {
        if (user) {
            loginButton.style.display = "none";
            userProfile.style.display = "flex";
            displayUserProfile(user);
        } else {
            loginButton.style.display = "block";
            userProfile.style.display = "none";
        }
    });

    function displayUserProfile(user) {
        const userPhoto = document.getElementById("userPhoto");
        const userName = document.getElementById("userName");
        userPhoto.src = user.photoURL || "https://via.placeholder.com/30";
        userName.textContent = user.displayName || "사용자";
    }

    function displayGuestProfile() {
        const userPhoto = document.getElementById("userPhoto");
        const userName = document.getElementById("userName");
        userPhoto.src = "https://via.placeholder.com/30";
        userName.textContent = "Guest";
    }
});
