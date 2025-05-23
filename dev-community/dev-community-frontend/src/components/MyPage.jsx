import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './MyPageStyles.css';
import FollowModal from './FollowModal';

// 더미 데이터 정의
/*const dummyUserInfo = {
  nickname: 'DevUser',
  profileImageUrl: null,
  followerCount: 3,
  followingCount: 2,
  receivedLikeCount: 15
};*/

/*const dummyFollowers = [
  { id: 'follower1', nickname: 'Follower One', profileImageUrl: null, isFollowing: false },
  { id: 'follower2', nickname: 'Follower Two', profileImageUrl: null, isFollowing: true },
  { id: 'follower3', nickname: 'Follower Three', profileImageUrl: null, isFollowing: false }
];

const dummyFollowing = [
  { id: 'following1', nickname: 'Following One', profileImageUrl: null, isFollowing: true },
  { id: 'following2', nickname: 'Following Two', profileImageUrl: null, isFollowing: true }
];*/

const MyPage = () => {
  const [userInfo, setUserInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showFollowModal, setShowFollowModal] = useState(false);
  const [followModalType, setFollowModalType] = useState('');
  const [followers, setFollowers] = useState([]);
  const [following, setFollowing] = useState([]);
  const [loginId, setLoginId] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    // localStorage에서 사용자 정보 가져오기
    const userStr = localStorage.getItem('user');
    if (!userStr) {
      navigate('/');
      return;
    }
    
    const user = JSON.parse(userStr);
    setLoginId(user.loginId);
    
    const fetchUserInfo = async () => {
      try {
        const response = await axios.get(`/member/${user.loginId}`);
        setUserInfo({
          ...response.data,
          id: user.loginId // id 정보 추가 (UI에서 사용)
        });
        setLoading(false);
        
        // 팔로워 및 팔로잉 데이터 가져오기
        fetchFollowers(user.loginId);
        fetchFollowing(user.loginId);
      } catch (error) {
        console.error('Error fetching user info:', error);
        // 서버 연결 실패 시 더미 데이터 사용
        /*setUserInfo({
          ...dummyUserInfo,
          id: user.loginId
        });
        setFollowers(dummyFollowers);
        setFollowing(dummyFollowing);*/
        setLoading(false);
      }
    };

    fetchUserInfo();
  }, [navigate]);

  const fetchFollowers = async (userLoginId) => {
    try {
      const response = await axios.get(`/member/${userLoginId}/followers`);
      // 기존 데이터 구조와 맞추기 위해 id 필드 추가
      const formattedFollowers = response.data.map(follower => ({
        ...follower,
        id: follower.loginId,
        isFollowing: false // API에서 제공하지 않으므로 기본값 설정
      }));
      setFollowers(formattedFollowers);
    } catch (error) {
      console.error('Error fetching followers:', error);
      // 서버 연결 실패 시 더미 데이터 사용
      //setFollowers(dummyFollowers);
    }
  };

  const fetchFollowing = async (userLoginId) => {
    try {
      const response = await axios.get(`/member/${userLoginId}/followings`);
      // 기존 데이터 구조와 맞추기 위해 id 필드 추가
      const formattedFollowing = response.data.map(following => ({
        ...following,
        id: following.loginId,
        isFollowing: true // 팔로잉 목록이므로 true로 설정
      }));
      setFollowing(formattedFollowing);
    } catch (error) {
      console.error('Error fetching following:', error);
      // 서버 연결 실패 시 더미 데이터 사용
      //setFollowing(dummyFollowing);
    }
  };

  // 나머지 코드는 동일하게 유지
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

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
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
      <div className="profile-header">
        <div className="profile-image">
          {userInfo.profileImageUrl ? (
            <img src={userInfo.profileImageUrl} alt={`${userInfo.nickname}'s profile`} />
          ) : (
            <div className="default-profile-image">
              {userInfo.nickname.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
        <div className="profile-info">
          <h1 className="username">{userInfo.id}</h1>
          <div className="profile-stats">
            <div className="stat">
              <span className="stat-count">0</span>
              <span className="stat-label">Posts</span>
            </div>
            <div className="stat clickable" onClick={openFollowersModal}>
              <span className="stat-count">{userInfo.followerCount}</span>
              <span className="stat-label">Followers</span>
            </div>
            <div className="stat clickable" onClick={openFollowingModal}>
              <span className="stat-count">{userInfo.followingCount}</span>
              <span className="stat-label">Following</span>
            </div>
            <div className="stat">
              <span className="stat-count">{userInfo.receivedLikeCount}</span>
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
      
      <div className="profile-tabs">
        <button className="tab active">Posts</button>
        <button className="tab">Saved</button>
        <button className="tab">Tagged</button>
      </div>
      
      <div className="profile-content">
        <div className="posts-grid">
          <div className="empty-state">
            <i className="bx bx-camera"></i>
            <p>No Posts Yet</p>
          </div>
        </div>
      </div>

      {showFollowModal && (
        <FollowModal 
          type={followModalType} 
          users={followModalType === 'followers' ? followers : following}
          onClose={closeFollowModal}
          currentUserId={userInfo.id}
        />
      )}
    </div>
  );
};

export default MyPage;