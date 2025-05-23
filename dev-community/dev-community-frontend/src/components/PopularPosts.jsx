import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './PostsPage.css';

const PopularPosts = () => {
  const navigate = useNavigate();
  const [allPosts, setAllPosts] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const postsPerPage = 10;

  const fetchAllPosts = async () => {
    try {
      const response = await axios.get('/post', {
        params: {
          page: 0,
          size: 1000, // 충분히 큰 값으로 전체 게시글을 가져옴
          sort: 'createdAt,desc'
        },
      });

      // likeCount 기준 내림차순 정렬
      const sorted = [...response.data.content].sort((a, b) => b.likeCount - a.likeCount);
      setAllPosts(sorted);
    } catch (error) {
      console.error('인기 게시글 불러오기 실패:', error);
    }
  };

  useEffect(() => {
    fetchAllPosts();
  }, []);

  const totalPages = Math.ceil(allPosts.length / postsPerPage);

  const currentPosts = allPosts.slice(
    (currentPage - 1) * postsPerPage,
    currentPage * postsPerPage
  );

  const pageNumbers = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <div className="posts-page">
      <header className="posts-header">
        <button className="back-btn" onClick={() => navigate(-1)}>
          <i className="bx bx-arrow-back"></i>
        </button>
        <h1>인기 게시글</h1>
      </header>

      <main className="posts-main">
        {currentPosts.map(post => (
          <div
            key={post.id}
            className="post-item"
            onClick={() => navigate(`/post/${post.id}`)}
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

        <div className="pagination">
          {pageNumbers.map(number => (
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