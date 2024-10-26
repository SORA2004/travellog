// scripts/addBlog.js

import { saveBlog, uploadImage, auth } from './firebase.js'; // auth를 추가로 임포트
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js';

document.addEventListener('DOMContentLoaded', () => {
  // Quill 에디터 초기화
  const quill = new Quill('#editor-container', {
    theme: 'snow',
    modules: {
      toolbar: {
        container: [
          [{ header: [1, 2, 3, false] }],
          ['bold', 'italic', 'underline', 'strike'],
          [{ size: ['small', false, 'large', 'huge'] }],
          [{ color: [] }, { background: [] }],
          ['image', 'video'],
          ['clean']
        ],
        handlers: {
          'image': imageHandler,
          'video': videoHandler
        }
      }
    }
  });

  // DOM 요소 가져오기
  const publishBtn = document.getElementById('saveBlogButton');
  const blogTitleInput = document.getElementById('blogTitle');
  const blogLocationInput = document.getElementById('blogLocation');
  const startDateInput = document.getElementById('startDate');
  const endDateInput = document.getElementById('endDate');
  const blogSummaryInput = document.getElementById('blogSummary');
  const tagsInput = document.getElementById('blogTags');
  const coverImageInput = document.getElementById('coverImage');
  const statusText = document.getElementById('status');
  const loadingSpinner = document.getElementById('loadingSpinner');

  // 모달 요소 가져오기
  const successModal = document.getElementById('successModal');
  const modalOverlay = document.getElementById('successModalOverlay');
  const closeModalButton = document.getElementById('closeModalButton');
	
	// 요소 존재 여부 확인
  if (!successModal || !modalOverlay || !closeModalButton) {
    console.error('모달 관련 요소를 찾을 수 없습니다.');
  }


  // Publish 버튼 클릭 시 Firestore에 게시글 저장
  publishBtn.addEventListener('click', async () => {

    if (!auth.currentUser) {
		const idToken = await user.getIdToken();
      statusText.textContent = '로그인이 필요합니다.';
      statusText.style.color = 'red';
      loadingSpinner.classList.add('hidden');
      return;
    }

    // 상태 메시지와 로딩 스피너 표시
    statusText.textContent = '';
    loadingSpinner.classList.remove('hidden');

    const blogTitle = blogTitleInput.value.trim();
    const blogContent = quill.root.innerHTML.trim(); // Quill 에디터의 HTML 내용을 가져옴
    const blogLocations = blogLocationInput.value.trim().split(',').map(location => location.trim()); // 배열로 변환
    const startDate = startDateInput.value;
    const endDate = endDateInput.value;
    const blogSummary = blogSummaryInput.value.trim();
    const tags = tagsInput ? tagsInput.value.split(',').map(tag => tag.trim()) : [];

    // 커버 이미지 가져오기 (옵션)
    let coverImageURL = '';
    if (coverImageInput && coverImageInput.files[0]) {
      try {
        coverImageURL = await uploadImage(coverImageInput.files[0]);
      } catch (error) {
        console.error('커버 이미지 업로드 실패:', error);
        statusText.textContent = '커버 이미지 업로드에 실패했습니다.';
        statusText.style.color = 'red';
        loadingSpinner.classList.add('hidden');
        return;
      }
    }

    // 모든 필드가 입력되었는지 확인
    if (!blogTitle || !blogContent || !blogLocations.length || !startDate || !endDate || !blogSummary) {
      statusText.textContent = '모든 필드를 입력해주세요.';
      statusText.style.color = 'red';
      loadingSpinner.classList.add('hidden');
      return;
    }

    try {
      await saveBlog(
        blogTitle,
        blogContent,
        blogLocations,
        startDate,
        endDate,
        blogSummary,
        tags,
        coverImageURL
      );

      // 입력 필드 초기화 (선택 사항)
      blogTitleInput.value = '';
      blogLocationInput.value = '';
      startDateInput.value = '';
      endDateInput.value = '';
      blogSummaryInput.value = '';
      if (tagsInput) tagsInput.value = '';
      if (coverImageInput) coverImageInput.value = '';
      quill.setContents([{ insert: '\n' }]); // Quill 에디터 초기화

      // 로딩 스피너 숨기기
      loadingSpinner.classList.add('hidden');

      // 성공 모달 표시
      openSuccessModal();

    } catch (error) {
      console.error('글 게시 실패:', error);
      statusText.textContent = '글 게시 실패';
      statusText.style.color = 'red';
      loadingSpinner.classList.add('hidden');
    }
  });

  // 성공 모달 열기 함수
  function openSuccessModal() {
    successModal.classList.add('active');
    modalOverlay.classList.add('active');
  }

  // 성공 모달 닫기 함수
  function closeSuccessModal() {
    successModal.classList.remove('active');
    modalOverlay.classList.remove('active');
    // 홈 화면으로 이동
    window.location.href = 'index.html'; // 홈 페이지로 리디렉션
  }

  // 모달 닫기 버튼 이벤트 리스너
  if (closeModalButton) {
    closeModalButton.addEventListener('click', closeSuccessModal);
  } else {
    console.error('closeModalButton 요소를 찾을 수 없습니다.');
  }

  // 모달 오버레이를 클릭하면 모달 닫기 (선택 사항)
  if (modalOverlay) {
    modalOverlay.addEventListener('click', closeSuccessModal);
  } else {
    console.error('modalOverlay 요소를 찾을 수 없습니다.');
  }


  // 이미지 업로드 핸들러
  async function imageHandler() {
    const input = document.createElement('input');
    input.setAttribute('type', 'file');
    input.setAttribute('accept', 'image/*');
    input.click();

    input.onchange = async () => {
      const file = input.files[0];
      if (file) {
        try {
          // 이미지 업로드
          const url = await uploadImage(file);
          // 에디터에 이미지 삽입
          const range = quill.getSelection();
          quill.insertEmbed(range.index, 'image', url);
        } catch (error) {
          console.error('이미지 업로드 실패:', error);
          alert('이미지 업로드 중 오류가 발생했습니다.');
        }
      }
    };
  }

  // 비디오 업로드 핸들러 (선택 사항)
  async function videoHandler() {
    const input = document.createElement('input');
    input.setAttribute('type', 'file');
    input.setAttribute('accept', 'video/*');
    input.click();

    input.onchange = async () => {
      const file = input.files[0];
      if (file) {
        try {
          // 비디오 업로드를 위한 별도의 함수 필요
          const url = await uploadVideo(file); // 별도의 uploadVideo 함수 구현 필요

          // 에디터에 비디오 삽입
          const range = quill.getSelection();
          quill.insertEmbed(range.index, 'video', url);
        } catch (error) {
          console.error('비디오 업로드 실패:', error);
          alert('비디오 업로드 중 오류가 발생했습니다.');
        }
      }
    };
  }

  // 비디오 업로드 함수
  async function uploadVideo(file) {
    try {
      const storageRef = ref(storage, `blog-videos/${file.name}_${Date.now()}`);
      const snapshot = await uploadBytes(storageRef, file);
      const url = await getDownloadURL(snapshot.ref);
      console.log("비디오가 업로드되었습니다:", url);
      return url;
    } catch (error) {
      console.error("비디오 업로드 중 오류 발생:", error);
      throw error;
    }
  }

  // 로그인 상태 확인 및 사용자 인증 처리
  onAuthStateChanged(auth, (user) => {
    if (!user) {
      alert('로그인이 필요합니다.');
      window.location.href = 'index.html'; // 로그인 페이지로 리디렉션
    }
  });
});
