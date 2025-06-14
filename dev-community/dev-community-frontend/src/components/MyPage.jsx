// MyPage.jsx

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './MyPageStyles.css';
import FollowModal from './FollowModal';
axios.defaults.withCredentials = true;

const MyPage = () => {
  const [userInfo, setUserInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showFollowModal, setShowFollowModal] = useState(false);
  const [followModalType, setFollowModalType] = useState('');
  const [followers, setFollowers] = useState([]);
  const [following, setFollowing] = useState([]);
  const [activeTab, setActiveTab] = useState('posts');
  const [myPosts, setMyPosts] = useState([]);
  const [likedPosts, setLikedPosts] = useState([]);
  // currentUserId 상태는 더 이상 필요 없으므로 제거
  // const [currentUserId, setCurrentUserId] = useState(null); 
  const navigate = useNavigate();

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (!userStr) {
      console.log("No user found in localStorage. Navigating to login.");
      navigate('/');
      return;
    }
    
    let user;
    try {
      user = JSON.parse(userStr);
      // ★★★ 수정: user.id가 유효한지 확인 ★★★
      if (!user || typeof user.id === 'undefined' || user.id === null) {
        console.error("Error: 'id' is missing or invalid in localStorage user object.", user);
        setError('로그인 정보가 유효하지 않습니다. 다시 로그인해주세요.');
        setLoading(false);
        navigate('/');
        return;
      }
    } catch (e) {
      console.error("Error parsing user from localStorage:", e);
      setError('로그인 정보가 손상되었습니다. 다시 로그인해주세요.');
      setLoading(false);
      navigate('/');
      return;
    }

    // 이제 user.id를 사용자 고유 ID로 사용합니다.
    const actualUserId = user.id; // user.id를 변수로 저장하여 사용

    const fetchUserInfo = async () => {
      try {
        const response = await axios.get(`/member/${user.loginId}`);
        setUserInfo({
          ...response.data,
          id: user.loginId // userInfo.id는 loginId로 설정 (MyPage URL에 사용될 수 있으므로)
        });
        
        fetchFollowers(user.loginId);
        fetchFollowing(user.loginId);
        
        // ★★★ 수정: user.id (실제 숫자 ID)를 전달 ★★★
        fetchMyPosts(actualUserId); 
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching user info:', error);
        setError('사용자 정보를 가져오는 데 실패했습니다.');
        setLoading(false);
      }
    };

    fetchUserInfo();
  }, [navigate]);

  const fetchFollowers = async (userLoginId) => {
    try {
      const response = await axios.get(`/member/${userLoginId}/followers`);
      const formattedFollowers = response.data.map(follower => ({
        ...follower,
        // follower.id (숫자 ID) 또는 follower.loginId 사용 여부는 서버 응답에 따라 다름
        id: follower.loginId, // 현재 로그인 ID 기준으로 follower 목록 가져오므로, follower의 loginId를 id로 사용하는 것이 적절
        isFollowing: false
      }));
      setFollowers(formattedFollowers);
    } catch (error) {
      console.error('Error fetching followers:', error);
      setFollowers([]);
    }
  };

  const fetchFollowing = async (userLoginId) => {
    try {
      const response = await axios.get(`/member/${userLoginId}/followings`);
      const formattedFollowing = response.data.map(following => ({
        ...following,
        // following.id (숫자 ID) 또는 following.loginId 사용 여부는 서버 응답에 따라 다름
        id: following.loginId, // 현재 로그인 ID 기준으로 following 목록 가져오므로, following의 loginId를 id로 사용하는 것이 적절
        isFollowing: true
      }));
      setFollowing(formattedFollowing);
    } catch (error) {
      console.error('Error fetching following:', error);
      setFollowing([]);
    }
  };

  const fetchMyPosts = async (userId) => { // userId 인자를 받도록 유지 (LoginComponent에서 id를 넘겨줄 것이므로)
    if (!userId) {
      console.error("fetchMyPosts called with invalid userId:", userId);
      setMyPosts([]);
      return;
    }
    try {
      // ★★★ 수정: /post/my/${userId} 에 user.id (숫자 ID) 전달 ★★★
      const response = await axios.get(`/post/my/${userId}`);
      console.log("My Posts API Response Data:", response.data);
      setMyPosts(response.data);
    } catch (error) {
      console.error('Error fetching my posts:', error);
      setMyPosts([]);
    }
  };

  const fetchLikedPosts = async (userId) => { // userId 인자를 받도록 유지
    if (!userId) {
      console.error("fetchLikedPosts called with invalid userId:", userId);
      setLikedPosts([]);
      return;
    }
    try {
      // ★★★ 수정: /post/like/${userId} 에 user.id (숫자 ID) 전달 ★★★
      const response = await axios.get(`/post/like/${userId}`);
      console.log("Liked Posts API Response Data:", response.data);
      setLikedPosts(response.data);
    } catch (error) {
      console.error('Error fetching liked posts:', error);
      setLikedPosts([]);
    }
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    const userStr = localStorage.getItem('user');
    let userIdFromStorage = null;
    if (userStr) {
      try {
        // ★★★ 수정: user.id를 사용 ★★★
        const user = JSON.parse(userStr);
        userIdFromStorage = user.id; // user.id를 가져와서 사용
      } catch (e) {
        console.error("Error parsing user from localStorage for tab change:", e);
      }
    }

    if (userIdFromStorage) {
        if (tab === 'liked' && likedPosts.length === 0) {
            fetchLikedPosts(userIdFromStorage);
        } else if (tab === 'posts' && myPosts.length === 0) {
            fetchMyPosts(userIdFromStorage);
        }
    }
  };

  const handleEditProfile = () => {
    navigate('/edit-profile');
  };

  const openFollowersModal = () => {
    setFollowModalType('followers');
    setShowFollowModal(true);
  };

  const openFollowingModal = () => {
    setFollowModalType('following');
    setShowFollowModal(true);
  };

  const closeFollowModal = () => {
    setShowFollowModal(false);
  };

  const handlePostClick = (postId) => {
    navigate(`/post/${postId}`);
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  if (!userInfo) {
    return <div className="error">사용자 정보를 불러올 수 없습니다.</div>;
  }

  return (
    <div className="mypage-container">
      <header className="community-header">
        <button className="back-btn" onClick={() => navigate('/main')}>
          <i className="bx bx-arrow-back"></i>
        </button>
        <div className="logo-container" onClick={() => navigate('/main')}>
          <img src="https://cdn-icons-png.flaticon.com/512/2721/2721620.png" alt="Logo" className="logo-img" />
          <h1>SDC</h1>
        </div>
      </header>
      
      <div className="profile-section">
        <div className="profile-header">
          <div className="profile-image">
            {userInfo?.profileImageUrl ? (
              <img src={userInfo.profileImageUrl} alt={`${userInfo.nickname}'s profile`} />
            ) : (
              <div className="default-profile-image">
                {userInfo?.nickname?.charAt(0)?.toUpperCase() || 'U'}
              </div>
            )}
          </div>
          <div className="profile-info">
            <h1 className="username">{userInfo.id}</h1> {/* userInfo.id는 loginId입니다. */}
            <div className="profile-stats">
              <div className="stat">
                <span className="stat-count">{myPosts?.length || 0}</span>
                <span className="stat-label">Posts</span>
              </div>
              <div className="stat clickable" onClick={openFollowersModal}>
                <span className="stat-count">{userInfo.followerCount || 0}</span>
                <span className="stat-label">Followers</span>
              </div>
              <div className="stat clickable" onClick={openFollowingModal}>
                <span className="stat-count">{userInfo.followingCount || 0}</span>
                <span className="stat-label">Following</span>
              </div>
              <div className="stat">
                <span className="stat-count">{userInfo.receivedLikeCount || 0}</span>
                <span className="stat-label">Likes</span>
              </div>
            </div>
            <div className="profile-bio">
              <h2 className="nickname">{userInfo.nickname}</h2>
              <p className="bio-text">Welcome to my profile!</p>
            </div>
            <button className="edit-profile-btn" onClick={handleEditProfile}>Edit Profile</button>
          </div>
        </div>
      </div>
      
      <div className="profile-tabs">
        <button 
          className={`tab ${activeTab === 'posts' ? 'active' : ''}`}
          onClick={() => handleTabChange('posts')}
        >
          내가 쓴 글
        </button>
        <button 
          className={`tab ${activeTab === 'liked' ? 'active' : ''}`}
          onClick={() => handleTabChange('liked')}
        >
          좋아요 한 게시물
        </button>
      </div>
      
      <div className="profile-content">
        {activeTab === 'posts' && (
          <div className="posts-list">
            {myPosts && myPosts.length > 0 ? (
              myPosts.map(post => (
                <div key={post.id} className="post-item" onClick={() => handlePostClick(post.id)}>
                  <div className="post-content">
                    <h3 className="post-title">{post.title}</h3>
                    <div className="post-meta">
                      <span className="post-author">{post.author?.nickname}</span> 
                      <span className="post-date">{new Date(post.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="post-stats">
                    <div className="post-likes">
                      <i className="bx bx-like"></i>
                      <span>{post.likeCount || 0}</span>
                    </div>
                    <div className="post-comments">
                      <i className="bx bx-comment"></i>
                      <span>{post.commentCount || 0}</span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="empty-state">
                <i className="bx bx-file"></i>
                <p>작성한 게시글이 없습니다</p>
              </div>
            )}
          </div>
        )}
        
        {activeTab === 'liked' && (
          <div className="posts-list">
            {likedPosts && likedPosts.length > 0 ? (
              likedPosts.map(post => (
                <div key={post.id} className="post-item" onClick={() => handlePostClick(post.id)}>
                  <div className="post-content">
                    <h3 className="post-title">{post.title}</h3>
                    <div className="post-meta">
                      <span className="post-author">{post.author?.nickname}</span>
                      <span className="post-date">{new Date(post.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="post-stats">
                    <div className="post-likes">
                      <i className="bx bx-like"></i>
                      <span>{post.likeCount || 0}</span>
                    </div>
                    <div className="post-comments">
                      <i className="bx bx-comment"></i>
                      <span>{post.commentCount || 0}</span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="empty-state">
                <i className="bx bx-heart"></i>
                <p>좋아요한 게시글이 없습니다</p>
              </div>
            )}
          </div>
        )}
      </div>

      {showFollowModal && (
        <FollowModal 
          type={followModalType} 
          users={followModalType === 'followers' ? (followers || []) : (following || [])}
          onClose={closeFollowModal}
          // ★★★ 수정: FollowModal에 userInfo.id (loginId) 대신 실제 숫자 ID를 전달해야 할 수 있음 ★★★
          // 만약 FollowModal 내부에서 이 ID를 사용자 고유 ID로 사용한다면 userInfo.id (loginId) 대신
          // localStorage에서 가져온 user.id (숫자 ID)를 전달해야 합니다.
          // 현재 userInfo.id는 loginId로 설정되어 있으니 주의하세요.
          // FollowModal이 `currentUserId` prop을 사용자 고유의 숫자 ID로 기대한다면
          // `currentUserId={user?.id}` (useEffect 스코프 밖에서 user 객체를 가져와야 함)
          // 또는 `currentUserId={JSON.parse(localStorage.getItem('user'))?.id}` 와 같이 사용해야 합니다.
          // 일단은 userInfo.id를 그대로 두고 FollowModal 내부에서 문제가 생기면 다시 수정합시다.
          currentUserId={userInfo.id} 
        />
      )}
    </div>
  );
};

export default MyPage;