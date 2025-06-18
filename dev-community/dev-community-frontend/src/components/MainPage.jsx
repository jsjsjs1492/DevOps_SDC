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
  const [profileImageUrl, setProfileImageUrl] = useState('https://cdn-icons-png.flaticon.com/512/3135/3135715.png'); // 기본 이미지 설정

  // 데이터 가져오기
  useEffect(() => {
    const fetchUser = async () => {
      // 로컬스토리지에서 loginId 가져오기
      const userStr = localStorage.getItem('user');
      if (!userStr) {
        setNickname('사용자'); // 로그인 정보가 없으면 기본값 설정
        return;
      }
      const user = JSON.parse(userStr);
      try {
        // loginId 기반으로 사용자 정보 조회
        const response = await axios.get(`/member/${user.loginId}`);
        setNickname(response.data.nickname);
        setProfileImageUrl(response.data.profileImageUrl || 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png'); // API 응답에 profileImageUrl이 없으면 기본 이미지 사용
      } catch (e) {
        console.error('유저 정보 로딩 실패', e);
        setNickname('사용자');
        setProfileImageUrl('https://cdn-icons-png.flaticon.com/512/3135/3135715.png');
      }
    };
    fetchUser();

    const fetchPosts = async () => {
      setLoading(true); // 로딩 시작은 여기서 한 번만

      try {
        // 1. 인기 게시글 먼저 가져오기 (순차 처리)
        const popularResponse = await axios.get('/post', {
          params: {
            page: 0,
            size: 8,
            sort: 'likeCounts,desc'
          }
        });
        setPopularPosts(popularResponse.data.content);

        // 2. 인기 게시글 로드 완료 후, 전체 게시글 가져오기 (순차 처리)
        const allPostsResponse = await axios.get('/post', {
          params: {
            page: 0,
            size: 8,
            sort: 'createdAt,desc'
          }
        });
        setAllPosts(allPostsResponse.data.content);

      } catch (error) { // 모든 에러를 여기서 처리
        console.error('게시글 로딩 실패:', error);
        setError('게시글을 불러오는데 실패했습니다. 서버 연결을 확인해주세요.');
      } finally {
        setLoading(false); // 성공하든 실패하든 로딩 상태를 false로 변경
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
    navigate(`/post/${id}`);
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
          <h2>서강대 개발자들을 위한 커뮤니티</h2>
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
          </div>
        )}

        <aside className="community-sidebar">
          <div className="sidebar-section user-profile">
            <div className="profile-header">
              {/* 프로필 이미지 URL을 API에서 가져온 값으로 변경 */}
              <img src={profileImageUrl} alt="Profile" className="profile-img" />
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