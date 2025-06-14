import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './MainPageStyles.css';
import './TagStyles.css'; // 태그 스타일 추가
import tags from '../data/tags'; // 태그 목록 import


const MainPage = () => {
  const navigate = useNavigate();
  const [logoutError, setLogoutError] = useState('');
  const [popularPosts, setPopularPosts] = useState([]);
  const [allPosts, setAllPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [nickname, setNickname] = useState('');

  // 데이터 가져오기
  useEffect(() => {
    const fetchUser = async () => {
      // 로컬스토리지에서 loginId 가져오기
      const userStr = localStorage.getItem('user');
      if (!userStr) return;
      const user = JSON.parse(userStr);
      try {
        // loginId 기반으로 사용자 정보 조회
        const response = await axios.get(`/member/${user.loginId}`);
        setNickname(response.data.nickname);
      } catch (e) {
        console.error('유저 정보 로딩 실패', e);
      }
    };
    fetchUser();

    const fetchPosts = async () => {
      try {
        setLoading(true);

        // 서버 요청 시도
        try {
          // 인기 게시글 가져오기
          const popularResponse = await axios.get('/post', {
            params: {
              page: 0,
              size: 8,
              // sort: 'recommendCount,desc'
              //  sort: 'likeCount,desc'
            }
          });
          // 프론트에서 likeCount 기준으로 정렬
          const sortedByLikeCount = popularResponse.data.content
            .slice() // 원본 배열 복사
            .sort((a, b) => b.likeCount - a.likeCount);

          // 상위 8개만 선택
          setPopularPosts(sortedByLikeCount.slice(0, 8));

          // 전체 게시글 가져오기
          const allPostsResponse = await axios.get('/post', {
            params: {
              page: 0,
              size: 8,
              sort: 'createdAt,desc'
            }
          });
          setAllPosts(allPostsResponse.data.content);
        } catch (error) {
          console.error('서버 연결 실패, 더미 데이터 사용:', error);
          // 서버 연결 실패 시 더미 데이터 사용
          /* setPopularPosts(dummyPosts.sort((a, b) => b.recommendCount - a.recommendCount));
           setAllPosts(dummyPosts.sort((a, b) => 
             new Date(b.createdAt) - new Date(a.createdAt)
           ));*/
        }

        setLoading(false);
      } catch (error) {
        console.error('게시글 로딩 실패:', error);
        setError('게시글을 불러오는데 실패했습니다.');
        setLoading(false);
      }
    };

    fetchPosts();
  }, []);

  // 로그아웃 처리 함수
  const handleLogout = async () => {
    try {
      await axios.post('/auth/logout');
      localStorage.removeItem('user');
      navigate('/');
    } catch (error) {
      console.error('로그아웃 실패:', error);
      localStorage.removeItem('user');
      navigate('/');
      if (error.response?.status === 401) {
        setLogoutError('이미 로그아웃되었거나 세션이 만료되었습니다.');
      } else {
        setLogoutError('로그아웃 중 오류가 발생했습니다.');
      }
    }
  };

  const handlePostClick = (id) => {
    navigate(`/post/${id}`);  // 이 부분이 제대로 동작하는지 확인
  };

  return (
    <div className="community-page">
      <header className="community-header">
        <div className="header-left">
          <div className="logo-container" onClick={() => navigate("/main")}>
            <img src="https://cdn-icons-png.flaticon.com/512/2721/2721620.png" alt="Logo" className="logo-img" />
            <h1>SDC</h1>
          </div>
        </div>
        <div className="header-right">
          <button className="mypage-btn" onClick={() => navigate('/mypage')}>
            <i className="bx bx-user"></i> 마이페이지
          </button>
          <button className="logout-btn" onClick={handleLogout}>
            <i className="bx bx-log-out"></i> 로그아웃
          </button>
        </div>
      </header>

      <div className="hero-section">
        <div className="hero-content">
          <h2>개발자들을 위한 커뮤니티</h2>
          <p>지식을 공유하고 함께 성장하세요</p>
        </div>
        <div className="hero-image">
          <img
            src="https://image.freepik.com/free-vector/developer-activity-concept-illustration_114360-2801.jpg"
            alt="Developer activity"
          />
        </div>
      </div>

      <main className="community-main">
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
        ) : (
          <div className="posts-container">
            <section className="posts-section popular-posts">
              <div className="section-header">
                <h2>인기 게시글</h2>
                <button
                  className="show-more-btn"
                  onClick={() => navigate('/popular-posts')}
                >
                  <i className="bx bx-plus"></i>
                </button>
              </div>
              <div className="post-list">
                {popularPosts.length > 0 ? (
                  popularPosts.map(post => (
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
                          <span className="post-date">{new Date(post.createdAt).toLocaleDateString()}</span>
                        </div>
                        {/* 태그 표시 */}
                        {post.tags && post.tags.length > 0 && (
                          <div className="post-tags">
                            {post.tags.slice(0, 3).map((tag) => (
                              <span 
                                key={tag} 
                                className="post-tag"
                                onClick={(e) => {
                                  e.stopPropagation(); // 이벤트 버블링 방지
                                  navigate(`/all-posts?tag=${tag}`);
                                }}
                              >
                                {tag}
                              </span>
                            ))}
                            {post.tags.length > 3 && <span className="post-tag">+{post.tags.length - 3}</span>}
                          </div>
                        )}
                      </div>
                      <div className="post-likes">
                        <i className="bx bx-like"></i>
                        <span>{post.likeCount}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="empty-posts">
                    <p>인기 게시글이 없습니다.</p>
                  </div>
                )}
              </div>
            </section>

            
            <section className="posts-section all-posts">
              <div className="section-header">
                <h2>전체 게시글</h2>
                <button
                  className="show-more-btn"
                  onClick={() => navigate('/all-posts')}
                >
                  <i className="bx bx-plus"></i>
                </button>
              </div>
              <div className="post-list">
                {allPosts.length > 0 ? (
                  allPosts.map(post => (
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
                          <span className="post-date">{new Date(post.createdAt).toLocaleDateString()}</span>
                        </div>
                        {/* 태그 표시 추가 */}
                        {post.tags && post.tags.length > 0 && (
                          <div className="post-tags">
                            {post.tags.slice(0, 3).map((tag) => (
                              <span 
                                key={tag} 
                                className="post-tag"
                                onClick={(e) => {
                                  e.stopPropagation(); // 이벤트 버블링 방지
                                  navigate(`/all-posts?tag=${tag}`);
                                }}
                              >
                                {tag}
                              </span>
                            ))}
                            {post.tags.length > 3 && <span className="post-tag">+{post.tags.length - 3}</span>}
                          </div>
                        )}
                      </div>
                      <div className="post-likes">
                        <i className="bx bx-like"></i>
                        <span>{post.likeCount}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="empty-posts">
                    <p>게시글이 없습니다.</p>
                  </div>
                )}
              </div>
            </section>
            
            {/* 이 아래에 있던 중복 태그 섹션을 제거했습니다. */}
            {/* <div className="sidebar-section">
              <h3>태그</h3>
              <div className="tag-cloud">
                {tags.map((tag) => (
                  <span 
                    key={tag} 
                    className="tag"
                    onClick={() => navigate(`/all-posts?tag=${tag}`)}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
            */}
          </div>
        )}

        <aside className="community-sidebar">
          <div className="sidebar-section user-profile">
            <div className="profile-header">
              <img src="https://cdn-icons-png.flaticon.com/512/3135/3135715.png" alt="Profile" className="profile-img" />
              <h3>환영합니다!</h3>
            </div>
            <p className="profile-info">{nickname ? `${nickname}님` : '사용자님'}</p>
            <button className="write-post-btn" onClick={() => navigate('/create-post')}>
              <i className="bx bx-edit"></i> 새 글 작성하기
            </button>
          </div>

          
          <div className="sidebar-section">
            <h3>태그</h3>
            <div className="tag-cloud">
              {tags.map((tag) => (
                <span 
                  key={tag} 
                  className="tag"
                  onClick={() => navigate(`/all-posts?tag=${tag}`)}
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </aside>
      </main>

      <footer className="community-footer">
        <p>© 2025 레츠고</p>
        <p className="attribution">Login design inspired by <a href="https://codepen.io/thepuskar/pen/gOgPqaJ" target="_blank" rel="noopener noreferrer">Puskar Adhikari</a></p>
      </footer>
    </div>
  );
};

export default MainPage;
