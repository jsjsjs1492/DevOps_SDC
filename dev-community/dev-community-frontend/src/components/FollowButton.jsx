// src/components/FollowButton.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './FollowButtonStyles.css';

export default function FollowButton({ authorLoginId, currentUserLoginId, initialIsFollowing, onFollowChange }) {
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
  const [loading, setLoading] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    setIsFollowing(initialIsFollowing);
  }, [initialIsFollowing]);

  useEffect(() => {
    if (!currentUserLoginId) {
      setLoading(false);
      return;
    }
    if (authorLoginId === currentUserLoginId) {
      setIsFollowing(true);
      setLoading(false);
      return;
    }

    let cancelled = false;
    async function fetchFollowState() {
      setLoading(true);
      try {
        const res = await axios.get(`/member/${currentUserLoginId}/followings`);
        if (!cancelled) {
          const currentStatus = res.data.some(f => f.loginId === authorLoginId);
          setIsFollowing(currentStatus);
          if(onFollowChange) onFollowChange(currentStatus); 
        }
      } catch (err) {
        console.error('팔로우 상태 조회 실패:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchFollowState();
    return () => { cancelled = true; };
  }, [currentUserLoginId, authorLoginId, onFollowChange]);

  const handleClick = async () => {
    setLoading(true);
    try {
      if (isFollowing) {
        await axios.delete(`/member/${authorLoginId}/follow`);
      } else {
        await axios.post(`/member/${authorLoginId}/follow`);
      }
      const newIsFollowing = !isFollowing;
      setIsFollowing(newIsFollowing);
      setIsHovered(false);
      if(onFollowChange) onFollowChange(newIsFollowing);
    } catch (error) {
      console.error('팔로우/언팔로우 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  if (authorLoginId === currentUserLoginId) {
    return null; 
  }

  return (
    <button
      className={[
        'follow-btn',
        isFollowing ? 'unfollow' : 'follow',
        isHovered   ? 'hovered'  : '',
      ].join(' ')}
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      disabled={loading}
     >
      {loading
        ? '...'
        : isFollowing
          ? (isHovered ? '언팔로우' : '팔로잉')
          : '팔로우'
      }
    </button>
  );
}