// scripts/profile.js

// 필요한 import 문은 그대로 유지
import { auth, db, monitorAuthState, storage } from './firebase.js';
import { updateProfile, signOut, deleteUser, reauthenticateWithCredential, EmailAuthProvider } from 'https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js';
import { ref, uploadBytes, getDownloadURL } from 'https://www.gstatic.com/firebasejs/9.22.2/firebase-storage.js';
import { collection, query, where, getDocs, orderBy, deleteDoc, doc } from 'https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js';

// 사용자 인증 상태를 모니터링하고 프로필 정보를 업데이트하는 함수
monitorAuthState(async (user) => {
  if (user) {
    const displayName = user.displayName || "이름 없음";
    const email = user.email || "이메일 없음";
    const photoURL = user.photoURL || "https://cdn.usegalileo.ai/stability/29274efa-9547-4ca7-b2af-b18a22f9456e.png"; // 기본 프로필 사진 URL

    // 프로필 이미지 설정
    const profileImageContainer = document.getElementById("profileImageContainer");
    if (profileImageContainer) {
      profileImageContainer.style.backgroundImage = `url("${photoURL}")`;
    } else {
      console.error("프로필 이미지 컨테이너를 찾을 수 없습니다.");
    }

    // 사용자 이름 및 이메일 설정
    const profileNameElement = document.getElementById("profileName");
    const profileEmailElement = document.getElementById("profileEmail");

    if (profileNameElement) {
      profileNameElement.textContent = `${displayName}'s Profile`;
    } else {
      console.error("프로필 이름 요소를 찾을 수 없습니다.");
    }

    if (profileEmailElement) {
      profileEmailElement.textContent = email;
    } else {
      console.error("프로필 이메일 요소를 찾을 수 없습니다.");
    }

    // 헤더의 프로필 사진, 이름, 이메일 설정
    const userPhoto = document.getElementById("userPhoto");
    const userName = document.getElementById("userName");
    const userEmail = document.getElementById("userEmail");

    if (userPhoto) {
      userPhoto.src = photoURL;
    } else {
      console.error("헤더 프로필 사진 요소를 찾을 수 없습니다.");
    }

    if (userName) {
      userName.textContent = displayName;
    } else {
      console.error("헤더 사용자 이름 요소를 찾을 수 없습니다.");
    }

    if (userEmail) {
      userEmail.textContent = email;
    } else {
      console.error("헤더 사용자 이메일 요소를 찾을 수 없습니다.");
    }

    // 프로필 섹션 표시
    const userProfile = document.getElementById("userProfile");
    if (userProfile) {
      userProfile.style.display = "flex";
    } else {
      console.error("사용자 프로필 섹션을 찾을 수 없습니다.");
    }
  } else {
    // 사용자가 로그인하지 않은 경우 처리
    const userProfile = document.getElementById("userProfile");
    if (userProfile) {
      userProfile.style.display = "none";
    } else {
      console.error("사용자 프로필 섹션을 찾을 수 없습니다.");
    }
    // 필요 시 로그인 페이지로 리디렉션
    // window.location.href = 'login.html';
  }
});

// '편집' 버튼 클릭 시 파일 선택 창 열기
const editProfileButton = document.getElementById("editProfileButton");
const profileImageInput = document.getElementById("profileImageInput");

if (editProfileButton && profileImageInput) {
  editProfileButton.addEventListener("click", () => {
    profileImageInput.click();
  });

  // 파일 선택 시 프로필 사진 업데이트
  profileImageInput.addEventListener("change", async (event) => {
    const file = event.target.files[0];
    if (file) {
      try {
        // 파일 형식 확인
        if (!file.type.startsWith('image/')) {
          alert("이미지 파일만 업로드할 수 있습니다.");
          return;
        }
        // 파일 크기 제한 (예: 2MB)
        const maxSize = 2 * 1024 * 1024; // 2MB
        if (file.size > maxSize) {
          alert("이미지 파일 크기는 2MB를 초과할 수 없습니다.");
          return;
        }

        // Firebase Storage에 이미지 업로드
        const storageRef = ref(storage, `profile-images/${auth.currentUser.uid}/${file.name}_${Date.now()}`);
        const snapshot = await uploadBytes(storageRef, file);
        const downloadURL = await getDownloadURL(snapshot.ref);
        console.log("이미지가 업로드되었습니다:", downloadURL);

        // Firebase Authentication 프로필 업데이트
        await updateProfile(auth.currentUser, {
          photoURL: downloadURL
        });

        // UI 업데이트
        if (profileImageContainer) {
          profileImageContainer.style.backgroundImage = `url("${downloadURL}")`;
        }

        // 헤더의 프로필 사진도 업데이트
        if (userPhoto) {
          userPhoto.src = downloadURL;
        }

        alert("프로필 사진이 성공적으로 업데이트되었습니다!");
      } catch (error) {
        console.error("프로필 사진 업데이트 중 오류 발생:", error);
        alert("프로필 사진을 업데이트하는 중 오류가 발생했습니다. 다시 시도해주세요.");
      }
    }
  });
}

// Delete 버튼 클릭 시 계정 삭제 로직 추가
document.addEventListener('DOMContentLoaded', () => {
  const deleteAccountButton = document.getElementById('deleteAccountButton');

  if (deleteAccountButton) {
    deleteAccountButton.addEventListener('click', async () => {
      const confirmDelete = confirm('정말로 계정을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.');

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

// 사용자 블로그 가져오기
async function loadUserBlogs(user) {
  if (!user) return;

  const userBlogsContainer = document.getElementById('userBlogsContainer');
  if (!userBlogsContainer) {
    console.error("사용자 블로그 컨테이너를 찾을 수 없습니다.");
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
    querySnapshot.forEach((doc) => {
      const blog = doc.data();
      const blogCard = `
        <div class="blog-card bg-white p-4 rounded shadow mb-4 flex">
          <img src="${blog.coverImageURL || 'https://via.placeholder.com/150'}" alt="블로그 커버 사진" class="w-24 h-24 object-cover rounded mr-4">
          <div class="blog-info flex-1">
            <h4 class="text-lg font-bold">${blog.title}</h4>
            <p class="text-sm text-gray-600">${blog.summary}</p>
            <button onclick="location.href='blog.html?id=${doc.id}'" class="text-blue-500 hover:underline mt-2">더 보기</button>
          </div>
        </div>
      `;
      userBlogsContainer.innerHTML += blogCard;
    });
  } catch (error) {
    console.error('사용자 블로그 가져오기 오류:', error);
    userBlogsContainer.innerHTML = '<p>블로그를 불러오는 중 오류가 발생했습니다.</p>';
  }
}

// 사용자 인증 상태를 모니터링하여 블로그 로드
monitorAuthState((user) => {
  if (user) {
    loadUserBlogs(user);
  }
});

// 로그아웃 버튼 클릭 시
const logoutButton = document.getElementById('logoutButton');
if (logoutButton) {
  logoutButton.addEventListener('click', async () => {
    try {
      await signOut(auth);
      alert('로그아웃 되었습니다.');
      window.location.href = 'index.html';
    } catch (error) {
      console.error('로그아웃 실패:', error);
      alert('로그아웃에 실패했습니다.');
    }
  });
}
