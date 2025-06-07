// src/components/AllPosts.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './PostsPage.css';

const AllPosts = () => {
  const navigate = useNavigate();

  // 게시글 목록, 페이지 관리용 상태
  const [posts, setPosts] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const postsPerPage = 10;

  // 검색어 상태 추가
  const [searchTerm, setSearchTerm] = useState('');

  // 서버에서 게시글(검색 포함)을 가져오는 함수
  const fetchPosts = async (page, keyword = '') => {
    try {
      let response;

      if (keyword && keyword.trim() !== '') {
        // 검색어가 있을 때: /post/search?query=검색어&page=...&size=...&sort=createdAt,desc
        response = await axios.get('/post/search', {
          params: {
            query: keyword.trim(),
            page: page - 1,       // 백엔드가 0-based 페이지 인덱스를 사용
            size: postsPerPage,
            sort: 'createdAt,desc'
          }
        });
      } else {
        // 검색어가 없을 때: /post?page=...&size=...&sort=createdAt,desc
        response = await axios.get('/post', {
          params: {
            page: page - 1,
            size: postsPerPage,
            sort: 'createdAt,desc'
          }
        });
      }

      // 백엔드 응답에서 게시글 목록과 전체 페이지 수를 꺼내서 상태에 저장
      setPosts(response.data.content);
      setTotalPages(response.data.totalPages);
    } catch (error) {
      console.error('전체 게시글 불러오기 실패:', error);
    }
  };

  // 컴포넌트가 마운트되거나 currentPage가 바뀔 때, 검색어 여부와 상관 없이 fetchPosts 호출
  useEffect(() => {
    fetchPosts(currentPage, searchTerm);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage]);

  // 검색 버튼 클릭 시 호출: 페이지를 1로 초기화하고 fetchPosts 실행
  const handleSearch = () => {
    setCurrentPage(1);
    fetchPosts(1, searchTerm);
  };

  // 페이지 번호 배열 생성 (1부터 totalPages까지)
  const pageNumbers = Array.from({ length: totalPages }, (_, i) => i + 1);

  // 게시글 클릭 시 상세 페이지로 이동
  const handlePostClick = (id) => {
    navigate(`/post/${id}`);
  };

  return (
    <div className="posts-page">
      {/* 뒤로 돌아가기 + 제목 */}
      <header className="posts-header">
        <button className="back-btn" onClick={() => navigate(-1)}>
          <i className="bx bx-arrow-back"></i>
        </button>
        <h1>전체 게시글</h1>
      </header>

      {/* 검색바 영역 (CSS 클래스 사용) */}
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
              <span>{post.likeCount}</span>
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

export default AllPosts;
