// src/components/UserDetail.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, useParams } from 'react-router-dom';
import './MyPageStyles.css';
import FollowModal from './FollowModal';
import FollowButton from './FollowButton';

const UserDetail = () => {
  const { loginId } = useParams();
  const navigate = useNavigate();
  const [userInfo, setUserInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showFollowModal, setShowFollowModal] = useState(false);
  const [followModalType, setFollowModalType] = useState('');
  const [followers, setFollowers] = useState([]);
  const [following, setFollowing] = useState([]);
  const [activeTab, setActiveTab] = useState('posts');
  const [userPosts, setUserPosts] = useState([]);
  const [likedPosts, setLikedPosts] = useState([]);
  const [currentLoggedInUser, setCurrentLoggedInUser] = useState(null);
  const [isAuthorFollowing, setIsAuthorFollowing] = useState(false);

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        setCurrentLoggedInUser(JSON.parse(userStr));
      } catch (e) {
        console.error('Error parsing current user from localStorage:', e);
      }
    }
  }, []);

  useEffect(() => {
    if (!loginId) {
      setError('사용자 ID가 제공되지 않았습니다.');
      setLoading(false);
      return;
    }

    const fetchUserInfo = async () => {
      try {
        const response = await axios.get(`/member/${loginId}`);
        console.log('Fetched User Detail Info:', response.data); 
        
        setUserInfo({
          ...response.data,
          loginId: response.data.loginId,
          actualId: response.data.id
        });
        
        fetchFollowers(loginId);
        fetchFollowing(loginId);
        fetchUserPosts(response.data.id); 
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching user info:', error);
        setError('사용자 정보를 가져오는 데 실패했습니다.');
        setLoading(false);
      }
    };

    fetchUserInfo();
  }, [loginId]);

  useEffect(() => {
    if (currentLoggedInUser && following.length > 0 && userInfo) {
      setIsAuthorFollowing(following.some(f => f.loginId === userInfo.loginId));
    }
  }, [currentLoggedInUser, following, userInfo]);

  const fetchFollowers = async (userLoginId) => {
    try {
      const response = await axios.get(`/member/${userLoginId}/followers`);
      const formattedFollowers = response.data.map(follower => ({
        ...follower,
        id: follower.loginId,
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
        id: following.loginId,
        isFollowing: true
      }));
      setFollowing(formattedFollowing);
    } catch (error) {
      console.error('Error fetching following:', error);
      setFollowing([]);
    }
  };

  const fetchUserPosts = async (userId) => {
    if (!userId) {
      console.error("fetchUserPosts called with invalid userId:", userId);
      setUserPosts([]);
      return;
    }
    try {
      const response = await axios.get(`/post/my/${userId}`);
      console.log("Fetched User Posts API Response Data:", response.data);
      setUserPosts(response.data);
    } catch (error) {
      console.error('Error fetching user posts:', error);
      setUserPosts([]);
    }
  };

  const fetchLikedPosts = async (userId) => {
    if (!userId) {
      console.error("fetchLikedPosts called with invalid userId:", userId);
      setLikedPosts([]);
      return;
    }
    try {
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
    if (userInfo?.actualId) { 
      if (tab === 'liked' && likedPosts.length === 0) {
          fetchLikedPosts(userInfo.actualId);
      } else if (tab === 'posts' && userPosts.length === 0) {
          fetchUserPosts(userInfo.actualId);
      }
    }
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
    return <div className="loading">로딩 중...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  if (!userInfo) {
    return <div className="error">사용자 정보를 불러올 수 없습니다.</div>;
  }

  const isCurrentUserPage = currentLoggedInUser && currentLoggedInUser.loginId === loginId;

  return (
    <div className="mypage-container">
      <header className="community-header">
        <button className="back-btn" onClick={() => navigate(-1)}>
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
            <h1 className="username">{userInfo.loginId}</h1>
            {!isCurrentUserPage && currentLoggedInUser && (
                <FollowButton
                  authorLoginId={userInfo.loginId}
                  currentUserLoginId={currentLoggedInUser.loginId}
                  initialIsFollowing={isAuthorFollowing} 
                  onFollowChange={(newIsFollowing) => setIsAuthorFollowing(newIsFollowing)}
                />
              )}
            <div className="profile-stats">
              <div className="stat">
                <span className="stat-count">{userPosts?.length || 0}</span>
                <span className="stat-label">게시글</span>
              </div>
              <div className="stat clickable" onClick={openFollowersModal}>
                <span className="stat-count">{userInfo.followerCount || 0}</span>
                <span className="stat-label">팔로워</span>
              </div>
              <div className="stat clickable" onClick={openFollowingModal}>
                <span className="stat-count">{userInfo.followingCount || 0}</span>
                <span className="stat-label">팔로잉</span>
              </div>
              <div className="stat">
                <span className="stat-count">{userInfo.receivedLikeCount || 0}</span>
                <span className="stat-label">받은 좋아요</span>
              </div>
            </div>
            <div className="profile-bio">
              <h2 className="nickname">{userInfo.nickname}</h2>
              <p className="bio-text">Welcome to my profile!</p>
            </div>
            {isCurrentUserPage && (
              <button className="edit-profile-btn" onClick={() => navigate('/edit-profile')}>
                프로필 수정
              </button>
            )}
          </div>
        </div>
      </div>
      
      <div className="profile-tabs">
        <button 
          className={`tab ${activeTab === 'posts' ? 'active' : ''}`}
          onClick={() => handleTabChange('posts')}
        >
          작성한 글
        </button>
        {isCurrentUserPage && (
            <button 
                className={`tab ${activeTab === 'liked' ? 'active' : ''}`}
                onClick={() => handleTabChange('liked')}
            >
                좋아요 한 게시물
            </button>
        )}
      </div>
      
      <div className="profile-content">
        {activeTab === 'posts' && (
          <div className="posts-list">
            {userPosts && userPosts.length > 0 ? (
              userPosts.map(post => (
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
                      <span>{post.likeCounts || 0}</span>
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
        
        {activeTab === 'liked' && isCurrentUserPage && (
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
                      <span>{post.likeCounts || 0}</span>
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
          currentUserId={currentLoggedInUser?.loginId}
        />
      )}
    </div>
  );
};

export default UserDetail;