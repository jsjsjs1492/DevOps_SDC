import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import './PostsPage.css';
import './TagStyles.css'; // 태그 스타일 추가
import tags from '../data/tags'; // 태그 목록 import
axios.defaults.withCredentials = true;

const AllPosts = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const tagParam = queryParams.get('tag');

  // 게시글 목록, 페이지 관리용 상태
  const [posts, setPosts] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const postsPerPage = 10;

  // 검색어 상태 추가
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTag, setSelectedTag] = useState(tagParam || '');

  // 로딩 및 에러 상태 추가
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 서버에서 게시글(검색 포함)을 가져오는 함수
  const fetchPosts = async (page, keyword = '', tag = '') => {
    try {
      setLoading(true); // 데이터 가져오기 시작 시 로딩 상태 true
      setError(null);   // 에러 상태 초기화

      let response;
      const params = {
        page: page - 1,
        size: postsPerPage,
        sort: 'createdAt,desc'
      };

      if (tag && tag.trim() !== '') {
        // 태그 검색 API 엔드포인트 및 파라미터 수정: /post/tag/search?query=tag_name
        response = await axios.get(`/post/tag/search`, {
          params: {
            ...params, // 기존 페이지네이션/정렬 파라미터 유지
            query: tag.trim() // API 명세에 따른 'query' 파라미터 사용
          }
        });
      } else if (keyword && keyword.trim() !== '') {
        // 검색어가 있을 때: /post/search?query=keyword
        response = await axios.get('/post/search', {
          params: {
            ...params, // 기존 페이지네이션/정렬 파라미터 유지
            query: keyword.trim()
          }
        });
      } else {
        // 검색어가 없을 때 (전체 게시글): /post
        response = await axios.get('/post', {
          params: params
        });
      }

      // 백엔드 응답에서 게시글 목록과 전체 페이지 수를 꺼내서 상태에 저장
      setPosts(response.data.content);
      setTotalPages(response.data.totalPages);
    } catch (err) {
      console.error('전체 게시글 불러오기 실패:', err);
      setError('게시글을 불러오는 데 실패했습니다.');
      setPosts([]);
      setTotalPages(0);
    } finally {
      setLoading(false); // 데이터 가져오기 완료 시 (성공 또는 실패) 로딩 상태 false
    }
  };

  // 컴포넌트가 마운트되거나 currentPage, selectedTag, searchTerm가 바뀔 때 fetchPosts 호출
  useEffect(() => {
    fetchPosts(currentPage, searchTerm, selectedTag);
  }, [currentPage, selectedTag, searchTerm]);

  // 검색 버튼 클릭 시 호출: 페이지를 1로 초기화하고 fetchPosts 실행 (useEffect에 의해 호출되므로 직접 호출은 선택 사항)
  const handleSearch = () => {
    setCurrentPage(1);
    setSelectedTag(''); // 태그 선택 초기화
  };

  // 태그 클릭 시 호출
  const handleTagClick = (tag) => {
    setSelectedTag(tag);
    setSearchTerm(''); // 검색어 초기화
    setCurrentPage(1);
    // URL 업데이트
    navigate(`/all-posts?tag=${tag}`);
  };

  // 태그 검색 취소
  const clearTagSearch = () => {
    setSelectedTag('');
    setCurrentPage(1);
    navigate('/all-posts');
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

      {/* 태그 검색 영역 */}
      <div className="tag-search-container">
        <h3 className="tag-search-title">태그로 검색</h3>
        <div className="tag-search-list">
          {/* tags.slice(0, 20)를 tags로 변경하여 모든 태그를 표시 */}
          {tags.map((tag) => (
            <span
              key={tag}
              className={`tag-item ${selectedTag === tag ? 'selected' : ''}`}
              onClick={() => handleTagClick(tag)}
            >
              {tag}
            </span>
          ))}
        </div>
        {selectedTag && (
          <div style={{ marginTop: '10px' }}>
            <button onClick={clearTagSearch} className="cancel-btn">
              태그 검색 취소
            </button>
          </div>
        )}
      </div>

      {/* 검색바 영역 */}
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
        {loading ? (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>게시글을 불러오는 중...</p>
          </div>
        ) : error ? (
          <div className="error-container">
            <p>{error}</p>
            <button onClick={() => window.location.reload()}>다시 시도</button>
          </div>
        ) : posts.length === 0 && !selectedTag && !searchTerm ? (
          <div className="empty-posts">
            <p>게시글이 없습니다.</p>
          </div>
        ) : posts.length === 0 && (selectedTag || searchTerm) ? (
          <div className="empty-posts">
            <p>선택하신 태그나 검색어에 해당하는 게시글이 없습니다.</p>
          </div>
        ) : (
          posts.map((post) => (
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
                {/* 태그 표시 */}
                {post.tags && post.tags.length > 0 && (
                  <div className="post-tags">
                    {post.tags.map((tag) => (
                      <span
                        key={tag}
                        className="post-tag"
                        onClick={(e) => {
                          e.stopPropagation(); // 이벤트 버블링 방지
                          handleTagClick(tag);
                        }}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <div className="post-likes">
                <i className="bx bx-like"></i>
                <span>{post.likeCount}</span>
              </div>
            </div>
          ))
        )}

        {/* 페이지네이션 (totalPages가 0보다 크고, 로딩 중이 아니며, 에러 상태가 아닐 때만 표시) */}
        {totalPages > 0 && !loading && !error && (
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
        )}
      </main>
    </div>
  );
};

export default AllPosts;