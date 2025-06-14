import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './ChangePasswordStyles.css';

const ChangePassword = () => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!currentPassword || !newPassword || !confirmPassword) {
      setError('All fields are required');
      return;
    }
    
    if (newPassword !== confirmPassword) {
      setError('New passwords do not match');
      return;
    }
    
    if (newPassword.length < 8) {
      setError('New password must be at least 8 characters long');
      return;
    }
    
    try {
      // 서버 요청 대신 로컬에서 비밀번호 변경 시뮬레이션
      // 실제로는 비밀번호가 변경되지 않지만 UI 흐름을 테스트할 수 있음
      setSuccess(true);
      setError('');
      
      // Clear form
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      
      // Redirect after 2 seconds
      setTimeout(() => {
        navigate('/edit-profile');
      }, 2000);
      
    } catch (error) {
      console.error('Error changing password:', error);
      if (error.response?.status === 401) {
        setError('Current password is incorrect');
      } else {
        setError('Failed to change password. Please try again.');
      }
    }
  };

  const handleGoBack = () => {
    navigate('/edit-profile');
  };

  return (
    <div className="change-password-container">
      <div className="change-password-header">
        <button className="back-button" onClick={handleGoBack}>
          &larr; Back
        </button>
        <h1>Change Password</h1>
      </div>
      
      {success && (
        <div className="success-message">
          Password changed successfully! Redirecting...
        </div>
      )}
      
      {error && (
        <div className="error-message">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="password-form">
        <div className="form-group">
          <label htmlFor="current-password">Current Password</label>
          <input
            type="password"
            id="current-password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="new-password">New Password</label>
          <input
            type="password"
            id="new-password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="confirm-password">Confirm New Password</label>
          <input
            type="password"
            id="confirm-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
        </div>
        
        <button type="submit" className="submit-button">Change Password</button>
      </form>
    </div>
  );
};

export default ChangePassword;