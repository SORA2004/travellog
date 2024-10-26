import { auth, GoogleAuthProvider, signInWithPopup, signInAnonymously } from './firebase';

// Google 로그인 처리
const googleLoginButton = document.getElementById("google-login-btn");
googleLoginButton.addEventListener("click", async () => {
    const provider = new GoogleAuthProvider();
    try {
        const result = await signInWithPopup(auth, provider);
        const user = result.user;
        console.log("로그인 성공: ", user);
    } catch (error) {
        console.error("로그인 오류: ", error);
    }
});

// 익명 로그인 처리
const anonymousLoginButton = document.getElementById("anonymous-login-btn");
anonymousLoginButton.addEventListener("click", async () => {
    try {
        const result = await signInAnonymously(auth);
        const user = result.user;
        console.log("익명 로그인 성공: ", user);
    } catch (error) {
        console.error("익명 로그인 오류: ", error);
    }
});
