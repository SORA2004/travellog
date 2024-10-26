// scripts/feedback.js
document.addEventListener('DOMContentLoaded', () => {
  const feedbackButton = document.getElementById('feedbackButton');
  const feedbackModal = document.getElementById('feedbackModal');
  const cancelButton = document.getElementById('cancelButton');
  const submitButton = document.getElementById('submitButton');
  const feedbackInput = document.getElementById('feedbackInput');

  // 개선 사항 버튼 클릭 시 모달 표시
  feedbackButton.addEventListener('click', () => {
    feedbackModal.classList.remove('hidden');
  });

  // 취소 버튼 클릭 시 모달 숨김
  cancelButton.addEventListener('click', () => {
    feedbackModal.classList.add('hidden');
    feedbackInput.value = ''; // 입력 필드 초기화
  });

  // 전송 버튼 클릭 시 처리
  submitButton.addEventListener('click', () => {
    const feedback = feedbackInput.value.trim();
    if (feedback) {
      // 여기에서 피드백을 전송하는 코드 추가 (예: Firebase 저장)
      console.log('전송된 개선 사항:', feedback);
      alert('감사합니다! 개선 사항이 제출되었습니다.');

      feedbackModal.classList.add('hidden');
      feedbackInput.value = ''; // 입력 필드 초기화
    } else {
      alert('개선 사항을 입력해 주세요.');
    }
  });
});
