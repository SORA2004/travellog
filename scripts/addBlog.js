// scripts/addblog.js

import { saveBlog } from './firebase.js';

document.addEventListener('DOMContentLoaded', () => {
  // 에디터 초기화
  var quill = new Quill('#editor-container', {
    theme: 'snow',
    modules: {
      toolbar: [
        [{ header: [1, 2, 3, false] }],
        ['bold', 'italic', 'underline', 'strike'],
        [{ size: ['small', false, 'large', 'huge'] }],
        [{ color: [] }, { background: [] }],
        ['image', 'video'],
        ['clean']
      ]
    }
  });

  // DOM 요소 가져오기
  const publishBtn = document.getElementById('saveBlogButton'); // 버튼 ID 수정 확인
  const blogTitleInput = document.getElementById('blogTitle');
  const blogLocationInput = document.getElementById('blogLocation');
  const startDateInput = document.getElementById('startDate'); // ID 수정 확인
  const endDateInput = document.getElementById('endDate');     // ID 수정 확인
  const blogSummaryInput = document.getElementById('blogSummary');
  const statusText = document.getElementById('status');

  // Publish 버튼 클릭 시 Firestore에 게시글 저장
  publishBtn.addEventListener('click', async () => {
    const blogTitle = blogTitleInput.value.trim();
    const blogContent = quill.root.innerHTML.trim(); // Quill 에디터의 HTML 내용을 가져옴
    const blogLocation = blogLocationInput.value.trim();
    const startDate = startDateInput.value;
    const endDate = endDateInput.value;
    const blogSummary = blogSummaryInput.value.trim();

    // 추가 필드 예시: 태그와 이미지 (옵션)
    const tagsInput = document.getElementById('blogTags'); // 추가된 태그 입력 필드
    // const imagesInput = document.getElementById('blogImages'); // 이미지 입력란이 없다면 제거

    const tags = tagsInput ? tagsInput.value.split(',').map(tag => tag.trim()) : [];
    // const images = imagesInput ? imagesInput.value.split(',').map(url => url.trim()) : [];

    // 모든 필드가 입력되었는지 확인
    if (!blogTitle || !blogContent || !blogLocation || !startDate || !endDate || !blogSummary) {
      statusText.textContent = '모든 필드를 입력해주세요.';
      statusText.style.color = 'red';
      return;
    }

    try {
      await saveBlog(blogTitle, blogContent, blogLocation, startDate, endDate, blogSummary, tags);
      statusText.textContent = '글이 성공적으로 게시되었습니다!';
      statusText.style.color = 'green';

      // 입력 필드 초기화
      blogTitleInput.value = '';
      blogLocationInput.value = '';
      startDateInput.value = '';
      endDateInput.value = '';
      blogSummaryInput.value = '';
      if (tagsInput) tagsInput.value = '';
      // if (imagesInput) imagesInput.value = '';
      quill.setContents([{ insert: '\n' }]); // Quill 에디터 초기화
    } catch (error) {
      console.error('글 게시 실패:', error);
      statusText.textContent = '글 게시 실패';
      statusText.style.color = 'red';
    }
  });
});
