import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import FollowButton from './FollowButton';
import './FollowModalStyles.css';

const FollowModal = ({ type, users, onClose, currentUserId }) => {
  const navigate = useNavigate();

  const handleUserClick = (loginId) => {
    onClose();
    navigate(`/user-detail/${loginId}`);
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
                  <div className="user-info clickable" onClick={() => handleUserClick(user.loginId)}>
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
                      <span className="user-loginid">@{user.loginId || user.id}</span>
                    </div>
                  </div>
                  
                  {user.loginId !== currentUserId && (
                    <FollowButton 
                      authorLoginId={user.loginId}
                      currentUserLoginId={currentUserId}
                      initialIsFollowing={user.isFollowing} 
                    />
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