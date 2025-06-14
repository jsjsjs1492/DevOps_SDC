import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './EditProfileStyles.css';

const EditProfile = () => {
    const [userInfo, setUserInfo] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showProfileOptions, setShowProfileOptions] = useState(false);

    // 닉네임 변경 상태
    const [newNickname, setNewNickname] = useState('');
    const [nicknameError, setNicknameError] = useState('');

    // 비밀번호 변경 상태
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [passwordError, setPasswordError] = useState('');

    const navigate = useNavigate();

    // 초기 사용자 정보 로드 (프로필 이미지 포함)
    const fetchUserInfo = async () => {
      const userStr = localStorage.getItem('user');
      if (!userStr) {
          navigate('/login');
          return;
      }
      const user = JSON.parse(userStr);
            try {
                // 백엔드에서 전체 사용자 정보(프로필 이미지 URL 포함)를 가져옵니다.
                // 이 API는 명세에 없지만, 마이페이지에서 사용한다면 있어야 합니다.
                // 없으면 user.loginId와 localStorage의 user.profileImageUrl을 사용해야 합니다.
                const response = await axios.get(`/member/${user.loginId}`);
                setUserInfo({
                    ...response.data,
                    id: user.loginId // 백엔드 응답에 loginId가 없을 경우를 대비
                });
                setLoading(false);
            } catch (error) {
                console.error('Error fetching user info:', error);
                if (error.response?.status === 401) {
                    navigate('/login');
                } else {
                    setError('사용자 정보를 불러오는데 실패했습니다.');
                    setLoading(false);
                }
            }
        };

    useEffect(() => {
    fetchUserInfo();
    }, [navigate]);

    // 로컬 스토리지에 사용자 정보 업데이트하는 헬퍼 함수
    const updateLocalStorageUser = (updatedProfileImageUrl) => {
        const userStr = localStorage.getItem('user');
        if (userStr) {
            const user = JSON.parse(userStr);
            const updatedUser = { ...user, profileImageUrl: updatedProfileImageUrl };
            localStorage.setItem('user', JSON.stringify(updatedUser));
        }
    };


    // 프로필 이미지 변경 핸들러
    const handleProfileImageClick = () => {
        setShowProfileOptions(!showProfileOptions);
    };

    // 프로필 이미지 업로드
    const handleChangeProfileImage = () => {
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = 'image/*';
        fileInput.onchange = async (e) => {
            const file = e.target.files[0];
            if (file) {
                try {
                    const formData = new FormData();
                    formData.append('file', file);

                    const response = await axios.post('/member/me/profile-image', formData, {
                        headers: {
                            'Content-Type': 'multipart/form-data'
                        }
                    });

                    const newImageUrl = response.data.profileImageUrl;

                    setUserInfo(prevInfo => ({ // 이전 상태를 기반으로 업데이트
                        ...prevInfo,
                        profileImageUrl: newImageUrl
                    }));

                    updateLocalStorageUser(newImageUrl); // 로컬 스토리지 업데이트

                    setShowProfileOptions(false);
                    alert('프로필 이미지가 성공적으로 변경되었습니다.');
                } catch (error) {
                    console.error('Error uploading profile image:', error);
                    alert('프로필 이미지 업로드에 실패했습니다.');
                }
            }
        };
        fileInput.click();
    };

    // 프로필 이미지 삭제 (기본 이미지로 재설정)
    const handleRemoveProfileImage = async () => {
        try {
            const response = await axios.delete('/member/me/profile-image');

            const defaultImageUrl = response.data.profileImageUrl; // API 명세에 따라 기본 이미지 URL 반환
            
            setUserInfo(prevInfo => ({ // 이전 상태를 기반으로 업데이트
                ...prevInfo,
                profileImageUrl: defaultImageUrl
            }));

            updateLocalStorageUser(defaultImageUrl); // 로컬 스토리지 업데이트

            setShowProfileOptions(false);
            alert('프로필 이미지가 기본 이미지로 변경되었습니다.');
        } catch (error) {
            console.error('Error removing profile image:', error);
            alert('프로필 이미지 삭제에 실패했습니다.');
        }
    };

    // 닉네임 변경 핸들러
    const handleNicknameSubmit = async (e) => {
        e.preventDefault();

        if (!newNickname.trim()) {
            setNicknameError('닉네임을 입력해주세요.');
            return;
        }

        try {
            const response = await axios.put('/member/me/nickname', { nickname: newNickname });

            await fetchUserInfo(); // 최신 정보 반영

            setNewNickname('');
            setNicknameError('');
            alert('닉네임이 성공적으로 변경되었습니다.');
        } catch (error) {
            console.error('Error changing nickname:', error);

            if (error.response?.status === 409) {
                setNicknameError('이미 사용 중인 닉네임입니다.');
            } else {
                setNicknameError('닉네임 변경에 실패했습니다.');
            }
        }
    };

    // 비밀번호 변경 핸들러
    const handlePasswordSubmit = async (e) => {
        e.preventDefault();

        if (!currentPassword) {
            setPasswordError('현재 비밀번호를 입력해주세요.');
            return;
        }

        if (!newPassword) {
            setPasswordError('새 비밀번호를 입력해주세요.');
            return;
        }

        if (newPassword !== confirmPassword) {
            setPasswordError('새 비밀번호와 확인 비밀번호가 일치하지 않습니다.');
            return;
        }
        
        // 비밀번호 유효성 검사 추가 (선택 사항, 백엔드 정책에 따라)
        // 예: 최소 8자, 영문, 숫자, 특수문자 포함
        // if (!/(?=.*\d)(?=.*[a-zA-Z])(?=.*[!@#$%^&*()_+])(.{8,})/.test(newPassword)) {
        //   setPasswordError('새 비밀번호는 최소 8자 이상, 영문, 숫자, 특수문자를 포함해야 합니다.');
        //   return;
        // }

        try {
            await axios.put('/member/me/password', {
                currentPassword,
                newPassword
            });

            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
            setPasswordError('');
            alert('비밀번호가 성공적으로 변경되었습니다.');
        } catch (error) {
            console.error('Error changing password:', error);

            if (error.response?.status === 400) {
                setPasswordError('현재 비밀번호가 일치하지 않거나 새 비밀번호가 요구사항을 충족하지 않습니다.');
            } else if (error.response?.status === 401) {
                // 인증 오류 (토큰 만료 등) 시 로그인 페이지로 리다이렉트
                alert('세션이 만료되었습니다. 다시 로그인 해주세요.');
                navigate('/login');
            }
            else {
                setPasswordError('비밀번호 변경에 실패했습니다.');
            }
        }
    };

    const handleGoBack = () => {
        navigate('/mypage');
    };

    if (loading) {
        return <div className="loading">Loading user information...</div>;
    }

    if (error) {
        return <div className="error-message">Error: {error}</div>;
    }

    // userInfo가 null일 경우를 대비하여 렌더링 전에 확인
    if (!userInfo) {
        return <div className="error-message">사용자 정보를 찾을 수 없습니다.</div>;
    }

    return (
        <div className="edit-profile-container">
            <div className="edit-profile-header">
                <button className="back-button" onClick={handleGoBack}>
                    &larr; 뒤로가기
                </button>
                <h1>프로필 수정</h1>
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
                                {userInfo.nickname ? userInfo.nickname.charAt(0).toUpperCase() : 'U'} {/* 닉네임 없을 경우 처리 */}
                            </div>
                        )}
                        <div className="image-overlay">
                            <span>변경</span>
                        </div>
                    </div>

                    {showProfileOptions && (
                        <div className="profile-image-options">
                            <button onClick={handleChangeProfileImage}>프로필 사진 변경</button>
                            <button onClick={handleRemoveProfileImage}>기본 이미지로 변경</button>
                            <button onClick={() => setShowProfileOptions(false)}>취소</button>
                        </div>
                    )}

                    <h2 className="profile-nickname">{userInfo.nickname}</h2>
                </div>

                <div className="edit-options">
                    <div className="edit-section">
                        <h3 className="section-title">닉네임 변경</h3>
                        <form onSubmit={handleNicknameSubmit} className="edit-form">
                            <div className="form-group">
                                <label htmlFor="nickname">새 닉네임</label>
                                <input
                                    type="text"
                                    id="nickname"
                                    value={newNickname}
                                    onChange={(e) => setNewNickname(e.target.value)}
                                    placeholder="새 닉네임 입력"
                                />
                                {nicknameError && <p className="error-message">{nicknameError}</p>}
                            </div>
                            <button type="submit" className="submit-button">닉네임 변경</button>
                        </form>
                    </div>

                    <div className="edit-section">
                        <h3 className="section-title">비밀번호 변경</h3>
                        <form onSubmit={handlePasswordSubmit} className="edit-form">
                            <div className="form-group">
                                <label htmlFor="currentPassword">현재 비밀번호</label>
                                <input
                                    type="password"
                                    id="currentPassword"
                                    value={currentPassword}
                                    onChange={(e) => setCurrentPassword(e.target.value)}
                                    placeholder="현재 비밀번호 입력"
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="newPassword">새 비밀번호</label>
                                <input
                                    type="password"
                                    id="newPassword"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    placeholder="새 비밀번호 입력"
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="confirmPassword">새 비밀번호 확인</label>
                                <input
                                    type="password"
                                    id="confirmPassword"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder="새 비밀번호 다시 입력"
                                />
                                {passwordError && <p className="error-message">{passwordError}</p>}
                            </div>
                            <button type="submit" className="submit-button">비밀번호 변경</button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EditProfile;