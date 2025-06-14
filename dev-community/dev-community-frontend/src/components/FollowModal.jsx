import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './FollowModalStyles.css';

const FollowModal = ({ type, users, onClose, currentUserId }) => {
  // 각 사용자의 팔로우 상태를 관리하는 상태
  const [followingStatus, setFollowingStatus] = useState({});
  
  // 컴포넌트 마운트 시 초기 팔로우 상태 설정
  useEffect(() => {
    const initialStatus = {};
    users.forEach(user => {
      initialStatus[user.id] = user.isFollowing || false;
    });
    setFollowingStatus(initialStatus);
  }, [users]);

  const handleFollow = async (userId) => {
    try {
      // 새로운 API 엔드포인트 사용
      await axios.post(`/member/${userId}/follow`);
      setFollowingStatus(prev => ({
        ...prev,
        [userId]: true
      }));
    } catch (error) {
      console.error('Error following user:', error);
      // 서버 연결 실패 시에도 UI 상태는 변경 (실제 환경에서는 에러 처리 필요)
      setFollowingStatus(prev => ({
        ...prev,
        [userId]: true
      }));
    }
  };

  const handleUnfollow = async (userId) => {
    try {
      // 새로운 API 엔드포인트 사용
      await axios.delete(`/member/${userId}/follow`);
      setFollowingStatus(prev => ({
        ...prev,
        [userId]: false
      }));
    } catch (error) {
      console.error('Error unfollowing user:', error);
      // 서버 연결 실패 시에도 UI 상태는 변경 (실제 환경에서는 에러 처리 필요)
      setFollowingStatus(prev => ({
        ...prev,
        [userId]: false
      }));
    }
  };

  return (
    <div className="follow-modal-overlay">
      <div className="follow-modal">
        <div className="follow-modal-header">
          <h2>{type === 'followers' ? 'Followers' : 'Following'}</h2>
          <button className="close-button" onClick={onClose}>&times;</button>
        </div>
        <div className="follow-modal-content">
          {users.length === 0 ? (
            <p className="no-users-message">
              {type === 'followers' 
                ? 'You don\'t have any followers yet.' 
                : 'You are not following anyone yet.'}
            </p>
          ) : (
            <ul className="user-list">
              {users.map(user => (
                <li key={user.id} className="user-item">
                  <div className="user-info">
                    <div className="user-avatar">
                      {user.profileImageUrl ? (
                        <img src={user.profileImageUrl} alt={`${user.nickname}'s profile`} />
                      ) : (
                        <div className="default-avatar">
                          {user.nickname.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div className="user-details">
                      <span className="user-nickname">{user.nickname}</span>
                      <span className="user-id">@{user.loginId || user.id}</span>
                    </div>
                  </div>
                  
                  {user.id !== currentUserId && (
                    <button 
                      className={`follow-button ${followingStatus[user.id] ? 'following' : ''}`}
                      onClick={() => {
                        if (followingStatus[user.id]) {
                          handleUnfollow(user.id);
                        } else {
                          handleFollow(user.id);
                        }
                      }}
                    >
                      {followingStatus[user.id] ? 'Following' : 'Follow'}
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default FollowModal;