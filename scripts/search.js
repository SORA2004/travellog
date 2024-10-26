// scripts/search.js

import { searchBlogsByTitle } from './firebase.js';

// 페이지네이션 관련 변수
let allResults = [];
const pageSize = 10;
let currentPage = 1;

// 결과를 현재 페이지에 맞게 표시
function displayResults() {
    const resultsContainer = document.getElementById('searchResults');
    resultsContainer.innerHTML = '';

    if (!Array.isArray(allResults)) {
        console.error('displayResults: allResults가 배열이 아닙니다:', allResults);
        allResults = [];
    }

    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedResults = allResults.slice(startIndex, endIndex);

    if (paginatedResults.length === 0) {
        resultsContainer.innerHTML = '<p class="text-center text-gray-500">검색 결과가 없습니다.</p>';
        return;
    }

    paginatedResults.forEach(data => {
        resultsContainer.innerHTML += `
            <a href="blog-detail.html?id=${data.id}" class="result-item p-4 border-b border-gray-200 hover:bg-gray-100 transition duration-200">
                <h3 class="text-xl font-semibold text-blue-600">${data.title}</h3>
                <p class="mt-2 text-gray-700">${data.summary}</p>
                <p class="mt-1 text-gray-600"><strong>여행지:</strong> ${data.location}</p>
                <p class="mt-1 text-gray-600"><strong>여행 기간:</strong> ${data.startDate.toDate().toLocaleDateString()} ~ ${data.endDate.toDate().toLocaleDateString()}</p>
            </a>
        `;
    });
}

// 페이징 버튼 설정
function setupPagination() {
    const paginationContainer = document.getElementById('pagination');
    paginationContainer.innerHTML = '';

    const totalPages = Math.ceil(allResults.length / pageSize);

    if (totalPages <= 1) return; // 페이지가 1개 이하이면 페이징 버튼을 표시하지 않음

    // 이전 버튼
    if (currentPage > 1) {
        const prevButton = document.createElement('button');
        prevButton.textContent = '이전';
        prevButton.classList.add('px-4', 'py-2', 'mx-1', 'bg-white', 'border', 'border-gray-300', 'text-gray-700', 'rounded-lg', 'hover:bg-gray-100', 'focus:outline-none', 'focus:ring-2', 'focus:ring-blue-500');
        prevButton.addEventListener('click', () => {
            currentPage--;
            displayResults();
            setupPagination();
            scrollToTop();
        });
        paginationContainer.appendChild(prevButton);
    }

    // 페이지 번호 버튼
    for (let i = 1; i <= totalPages; i++) {
        const pageButton = document.createElement('button');
        pageButton.textContent = i;
        pageButton.classList.add('px-4', 'py-2', 'mx-1', 'bg-white', 'border', 'border-gray-300', 'text-gray-700', 'rounded-lg', 'hover:bg-gray-100', 'focus:outline-none', 'focus:ring-2', 'focus:ring-blue-500');
        if (i === currentPage) {
            pageButton.classList.add('bg-blue-500', 'text-white');
        }
        pageButton.addEventListener('click', () => {
            currentPage = i;
            displayResults();
            setupPagination();
            scrollToTop();
        });
        paginationContainer.appendChild(pageButton);
    }

    // 다음 버튼
    if (currentPage < totalPages) {
        const nextButton = document.createElement('button');
        nextButton.textContent = '다음';
        nextButton.classList.add('px-4', 'py-2', 'mx-1', 'bg-white', 'border', 'border-gray-300', 'text-gray-700', 'rounded-lg', 'hover:bg-gray-100', 'focus:outline-none', 'focus:ring-2', 'focus:ring-blue-500');
        nextButton.addEventListener('click', () => {
            currentPage++;
            displayResults();
            setupPagination();
            scrollToTop();
        });
        paginationContainer.appendChild(nextButton);
    }
}

// 페이지 상단으로 스크롤
function scrollToTop() {
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
}

// 검색 기능 호출 및 페이징 설정
async function performSearch(query) {
    try {
        currentPage = 1; // 페이지 초기화
        allResults = await searchBlogsByTitle(query);

        if (!Array.isArray(allResults)) {
            console.error('검색 결과가 배열이 아닙니다:', allResults);
            allResults = [];
        }

        console.log('allResults:', allResults);

        displayResults();
        setupPagination();
    } catch (error) {
        console.error('검색 중 오류 발생:', error);
    }
}

// 검색 바 및 페이지네이션 처리
document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('searchInput');
    const searchButton = document.getElementById('searchButton');
    const searchResultsTitle = document.getElementById('searchResultsTitle');
    let searchQuery = new URLSearchParams(window.location.search).get('query');
	
	console.log('searchInput:', searchInput);
    console.log('searchButton:', searchButton);
    console.log('searchResultsTitle:', searchResultsTitle);

    // 검색어로 페이지 초기화
    if (searchInput && searchButton) {  // 요소가 존재할 때만 실행
        if (searchQuery) {
            searchResultsTitle.textContent = `'${searchQuery}'에 관한 검색 결과`;
            searchInput.value = searchQuery;
            performSearch(searchQuery);
        }

        // 검색 바에서 검색
        searchButton.addEventListener('click', () => {
            searchQuery = searchInput.value.trim();
            if (searchQuery) {
                window.history.replaceState({}, '', `search-results.html?query=${encodeURIComponent(searchQuery)}`);
                searchResultsTitle.textContent = `'${searchQuery}'에 관한 검색 결과`;
                performSearch(searchQuery);
            }
        });

        // 엔터 키로도 검색 가능하게 설정
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                searchButton.click();
            }
        });

        // 실시간 검색 기능 (옵션)
        searchInput.addEventListener('input', () => {
            const realtimeQuery = searchInput.value.trim();
            if (realtimeQuery) {
                searchResultsTitle.textContent = `'${realtimeQuery}'에 관한 검색 결과`;
                performSearch(realtimeQuery);
            } else {
                searchResultsTitle.textContent = '검색 결과';
                allResults = [];
                displayResults();
                setupPagination();
            }
        });
    } else {
        console.error('검색 입력창 또는 검색 버튼 요소를 찾을 수 없습니다.');
    }
});
