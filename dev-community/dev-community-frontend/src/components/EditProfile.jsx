import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './EditProfileStyles.css';

// 더미 데이터 정의
/*const dummyUserInfo = {
  id: 'user123',
  nickname: 'DevUser',
  email: 'user@example.com',
  profileImageUrl: null
};*/

const EditProfile = () => {
  const [userInfo, setUserInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showProfileOptions, setShowProfileOptions] = useState(false);
  const [newNickname, setNewNickname] = useState('');
  const [isEditingNickname, setIsEditingNickname] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const response = await axios.get('/user/me');
        setUserInfo(response.data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching user info:', error);
        if (error.response?.status === 401) {
          navigate('/login');
        } 
        /*else {
          // 서버 연결 실패 시 더미 데이터 사용
          setUserInfo(dummyUserInfo);
          setLoading(false);
        }*/
      }
    };

    fetchUserInfo();
  }, [navigate]);

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  const handleProfileImageClick = () => {
    setShowProfileOptions(!showProfileOptions);
  };

  const handleChangeProfileImage = () => {
    // 로컬 테스트용 이미지 변경 시뮬레이션
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*';
    fileInput.onchange = async (e) => {
      const file = e.target.files[0];
      if (file) {
        try {
          // 서버 요청 대신 로컬에서 이미지 URL 생성
          const imageUrl = URL.createObjectURL(file);
          setUserInfo({
            ...userInfo,
            profileImageUrl: imageUrl
          });
          setShowProfileOptions(false);
        } catch (error) {
          console.error('Error handling profile image:', error);
          alert('Failed to change profile image');
        }
      }
    };
    fileInput.click();
  };

  const handleRemoveProfileImage = async () => {
    try {
      // 서버 요청 대신 로컬에서 이미지 제거
      setUserInfo({
        ...userInfo,
        profileImageUrl: null
      });
      setShowProfileOptions(false);
    } catch (error) {
      console.error('Error removing profile image:', error);
      alert('Failed to remove profile image');
    }
  };

  const handleNicknameChange = async (e) => {
    e.preventDefault();
    if (!newNickname.trim()) {
      alert('닉네임을 입력해주세요.');
      return;
    }

    try {
      await axios.patch('/user/nickname', { nickname: newNickname });
      alert('닉네임이 성공적으로 변경되었습니다.');
      navigate('/mypage');
    } catch (error) {
      if (error.response?.status === 409) {
        alert('이미 사용 중인 닉네임입니다.');
      } else {
        alert('닉네임 변경에 실패했습니다. 다시 시도해주세요.');
      }
    }
  };

 

  const handleChangeNickname = () => {
    const nickname = prompt('새로운 닉네임을 입력하세요:', userInfo.nickname);
    if (nickname && nickname !== userInfo.nickname) {
      updateNickname(nickname);
    }
  };

  const updateNickname = async (nickname) => {
    try {
      await axios.patch('/user/nickname', { nickname });
      setUserInfo({
        ...userInfo,
        nickname: nickname
      });
      alert('닉네임이 성공적으로 변경되었습니다.');
    } catch (error) {
      if (error.response?.status === 409) {
        alert('이미 사용 중인 닉네임입니다.');
      } else {
        alert('닉네임 변경에 실패했습니다. 다시 시도해주세요.');
      }
    }
  };

  const handleChangePassword = () => {
    navigate('/change-password');
  };

  const handleGoBack = () => {
    navigate('/mypage');
  };

  return (
    <div className="edit-profile-container">
      <div className="edit-profile-header">
        <button className="back-button" onClick={handleGoBack}>
          &larr; Back
        </button>
        <h1>Edit Profile</h1>
      </div>

      <div className="profile-edit-section">
        <div className="profile-image-container">
          <div 
            className="profile-image-edit" 
            onClick={handleProfileImageClick}
          >
            {userInfo.profileImageUrl ? (
              <img src={userInfo.profileImageUrl} alt={`${userInfo.nickname}'s profile`} />
            ) : (
              <div className="default-profile-image">
                {userInfo.nickname.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="image-overlay">
              <span>Change</span>
            </div>
          </div>
          
          {showProfileOptions && (
            <div className="profile-image-options">
              <button onClick={handleChangeProfileImage}>Change Profile Photo</button>
              <button onClick={handleRemoveProfileImage}>Remove Current Photo</button>
              <button onClick={() => setShowProfileOptions(false)}>Cancel</button>
            </div>
          )}
          
          <h2 className="profile-nickname">{userInfo.nickname}</h2>
        </div>

        <div className="edit-options">
          <div className="edit-option">
            <div className="option-info">
              <h3>Nickname</h3>
              {isEditingNickname ? (
                <form onSubmit={updateNickname} className="nickname-form">
                  <input
                    type="text"
                    value={newNickname}
                    onChange={(e) => setNewNickname(e.target.value)}
                    placeholder={userInfo.nickname}
                  />
                  <div className="nickname-buttons">
                    <button type="submit">저장</button>
                    <button type="button" onClick={() => setIsEditingNickname(false)}>취소</button>
                  </div>
                </form>
              ) : (
                <p>{userInfo.nickname}</p>
              )}
            </div>
            {!isEditingNickname && (
              <button onClick={handleChangeNickname}>Change</button>
            )}
          </div>

          <div className="edit-option">
            <div className="option-info">
              <h3>Password</h3>
              <p>••••••••</p>
            </div>
            <button onClick={handleChangePassword}>Change</button>
          </div>

          <div className="edit-option">
            <div className="option-info">
              <h3>Email</h3>
              <p>{userInfo.email}</p>
            </div>
            <span className="readonly-label">Read only</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditProfile;