// 모달 열기 및 닫기 처리
const modal = document.getElementById("loginModal");
const loginButton = document.getElementById("loginButton"); // 로그인 버튼
const closeModal = document.getElementsByClassName("close")[0];

// 로그인 버튼 클릭 시 모달 열기
loginButton.addEventListener("click", () => {
    modal.style.display = "block";
});

// 닫기 버튼 클릭 시 모달 닫기
closeModal.addEventListener("click", () => {
    modal.style.display = "none";
});

// 모달 외부를 클릭 시 모달 닫기
window.addEventListener("click", (event) => {
    if (event.target == modal) {
        modal.style.display = "none";
    }
});
