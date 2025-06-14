// src/components/PopularPosts.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './PostsPage.css';

const PopularPosts = () => {
  const navigate = useNavigate();

  // 전체 게시글(또는 검색 결과)을 담을 상태
  const [posts, setPosts] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const postsPerPage = 10;

  // 검색어 상태
  const [searchTerm, setSearchTerm] = useState('');

  // 인기 게시글(또는 검색 결과)을 가져오는 함수
  const fetchPosts = async (page, keyword = '') => {
    try {
      let response;

      if (keyword && keyword.trim() !== '') {
        // ● 검색어가 있을 때: /post/search?query=xxx&page=...&size=...&sort=likeCounts,desc
        response = await axios.get('/post/search', {
          params: {
            query: keyword.trim(),
            page: page - 1,      // 백엔드는 0-based 페이지 인덱스를 사용
            size: postsPerPage,
            sort: 'likeCounts,desc'  // ← 필드명을 likeCounts 로 변경
          }
        });
      } else {
        // ● 검색어 없으면 인기 게시글 조회: /post?page=...&size=...&sort=likeCounts,desc
        response = await axios.get('/post', {
          params: {
            page: page - 1,
            size: postsPerPage,
            sort: 'likeCounts,desc'  // ← 필드명을 likeCounts 로 변경
          }
        });
      }

      // 응답에서 content(게시글 배열)와 totalPages(전체 페이지 수)를 꺼내서 저장
      setPosts(response.data.content);
      setTotalPages(response.data.totalPages);
    } catch (error) {
      console.error('인기 게시글 불러오기 실패:', error);
    }
  };

  // 컴포넌트가 마운트되거나 currentPage가 바뀔 때마다 fetchPosts 호출
  useEffect(() => {
    fetchPosts(currentPage, searchTerm);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage]);

  // 검색 버튼 클릭 시: 페이지를 1로 초기화하고 fetchPosts 호출
  const handleSearch = () => {
    setCurrentPage(1);
    fetchPosts(1, searchTerm);
  };

  // 페이지 번호 배열 (1 ~ totalPages)
  const pageNumbers = Array.from({ length: totalPages }, (_, i) => i + 1);

  // 게시글 클릭 시 상세 화면으로 이동
  const handlePostClick = (id) => {
    navigate(`/post/${id}`);
  };

  return (
    <div className="posts-page">
      {/* 헤더: 뒤로가기 + 제목 */}
      <header className="posts-header">
        <button className="back-btn" onClick={() => navigate('/main')}>
          <i className="bx bx-arrow-back"></i>
        </button>
        <h1>인기 게시글</h1>
      </header>

      {/* 검색창 영역 */}
      <div className="search-bar-wrap">
        <input
          type="text"
          className="search-input"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="검색어를 입력하세요"
        />
        <button className="search-btn" onClick={handleSearch}>
          검색
        </button>
      </div>

      {/* 게시글 리스트 */}
      <main className="posts-main">
        {posts.map((post) => (
          <div
            key={post.id}
            className="post-item"
            onClick={() => handlePostClick(post.id)}
            style={{ cursor: 'pointer' }}
          >
            <div className="post-content">
              <h3 className="post-title">{post.title}</h3>
              <div className="post-meta">
                <span className="post-author">{post.author.nickname}</span>
                <span className="post-date">
                  {new Date(post.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
            <div className="post-likes">
              <i className="bx bx-like"></i>
              <span>{post.likeCounts}</span> {/* 백엔드 필드명: likeCounts */}
            </div>
          </div>
        ))}

        {/* 페이지네이션 */}
        <div className="pagination">
          {pageNumbers.map((number) => (
            <button
              key={number}
              className={`page-number ${currentPage === number ? 'active' : ''}`}
              onClick={() => setCurrentPage(number)}
            >
              {number}
            </button>
          ))}
        </div>
      </main>
    </div>
  );
};

export default PopularPosts;
