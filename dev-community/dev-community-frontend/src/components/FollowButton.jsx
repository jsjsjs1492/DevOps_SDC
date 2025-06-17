import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './FollowButtonStyles.css';

export default function FollowButton({ authorLoginId, currentUserLoginId, initialIsFollowing, onFollowChange }) {
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
  const [loading, setLoading] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  // initialIsFollowing prop이 변경될 때 isFollowing 상태 업데이트
  useEffect(() => {
    setIsFollowing(initialIsFollowing);
  }, [initialIsFollowing]);

  // 현재 사용자와 작성자 ID를 기반으로 팔로우 상태를 비동기적으로 조회
  useEffect(() => {
    // currentUserLoginId가 없으면 로딩 상태 해제하고 종료
    if (!currentUserLoginId) {
      setLoading(false);
      return;
    }
    // 작성자 ID와 현재 사용자 ID가 같으면 팔로우 상태를 true로 설정하고 종료 (자기 자신은 항상 팔로잉)
    if (authorLoginId === currentUserLoginId) {
      setIsFollowing(true);
      setLoading(false);
      return;
    }

    let cancelled = false; // 불필요한 상태 업데이트 방지 (cleanup 함수용)
    
    async function fetchFollowState() {
      setLoading(true); // 로딩 시작
      try {
        // 현재 사용자의 팔로잉 목록을 가져옴
        const res = await axios.get(`/member/${currentUserLoginId}/followings`);
        if (!cancelled) {
          // 팔로잉 목록에 현재 버튼의 작성자가 있는지 확인
          const currentStatus = res.data.some(f => f.loginId === authorLoginId);
          setIsFollowing(currentStatus); // 팔로우 상태 업데이트
          if(onFollowChange) onFollowChange(currentStatus); // 부모 컴포넌트에 변경 알림
        }
      } catch (err) {
        console.error('팔로우 상태 조회 실패:', err); // 에러 로깅
      } finally {
        if (!cancelled) setLoading(false); // 로딩 종료
      }
    }
    
    fetchFollowState(); // 함수 호출
    return () => { cancelled = true; }; // 컴포넌트 언마운트 또는 의존성 변경 시 요청 취소
  }, [currentUserLoginId, authorLoginId, onFollowChange]); // 의존성 배열

  // 팔로우/언팔로우 버튼 클릭 핸들러
  const handleClick = async () => {
    setLoading(true); // 로딩 시작
    try {
      if (isFollowing) {
        // 이미 팔로잉 중이면 언팔로우 (DELETE 요청)
        await axios.delete(`/member/${authorLoginId}/follow`);
      } else {
        // 팔로잉 중이 아니면 팔로우 (POST 요청)
        await axios.post(`/member/${authorLoginId}/follow`);
      }
      const newIsFollowing = !isFollowing; // 새 팔로우 상태 (토글)
      setIsFollowing(newIsFollowing); // 상태 업데이트
      setIsHovered(false); // 클릭 후 호버 상태 초기화 (마우스가 올라간 상태라도 초기화)
      if(onFollowChange) onFollowChange(newIsFollowing); // 부모 컴포넌트에 변경 알림
    } catch (error) {
      console.error('팔로우/언팔로우 실패:', error); // 에러 로깅
    } finally {
      setLoading(false); // 로딩 종료
    }
  };

  // 현재 사용자가 버튼의 작성자와 동일하면 버튼을 렌더링하지 않음
  if (authorLoginId === currentUserLoginId) {
    return null; 
  }

  // 버튼 렌더링
  return (
    <button
      className={[
        'follow-btn', // 기본 클래스
        isFollowing ? 'unfollow' : 'follow', // 팔로우 상태에 따른 클래스 (언팔로우/팔로우)
        isHovered   ? 'hovered'   : '',       // 마우스 호버 상태에 따른 클래스
      ].join(' ')}
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)} // 마우스 진입 시 호버 상태 true
      onMouseLeave={() => setIsHovered(false)} // 마우스 이탈 시 호버 상태 false
      disabled={loading} // 로딩 중에는 버튼 비활성화
     >
      {loading // 로딩 중일 때 표시
        ? '...'
        : isFollowing // 팔로잉 중일 때
          ? (isHovered ? '언팔로우' : '팔로잉') // 호버 시 '언팔로우', 아니면 '팔로잉'
          : '팔로우' // 팔로잉 중이 아닐 때 (항상 '팔로우')
      }
    </button>
  );
}