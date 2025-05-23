import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './CreatePostStyles.css';

const CreatePost = () => {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!title.trim() || !content.trim()) {
      alert('제목과 내용을 모두 입력해주세요.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      // 게시글 작성 API 호출
      const response = await axios.post('/post', {
        title,
        content
      });
      
      // 작성 성공 시 해당 게시글 상세 페이지로 이동
      navigate(`/post/${response.data.id}`);
    } catch (error) {
      console.error('게시글 작성 실패:', error);
      
      if (error.response) {
        const { status } = error.response;
        if (status === 400) {
          setError('제목과 내용을 올바르게 입력해주세요.');
        } else if (status === 401) {
          alert('로그인이 필요합니다.');
          navigate('/login');
        } else {
          setError('게시글 작성에 실패했습니다.');
        }
      } else {
        setError('서버 연결에 실패했습니다.');
      }
      
      setLoading(false);
    }
  };

  return (
    <div className="create-post">
      <header className="community-header">
        <button className="back-btn" onClick={() => navigate(-1)}>
          <i className="bx bx-arrow-back"></i>
        </button>
        <div className="logo-container" onClick={() => navigate("/main")}>
          <img src="https://cdn-icons-png.flaticon.com/512/2721/2721620.png" alt="Logo" className="logo-img" />
          <h1>SDC</h1>
        </div>
      </header>

      <div className="create-post-container">
        <h1>새 게시글 작성</h1>
        
        {error && <div className="error-message">{error}</div>}
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="title">제목</label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="제목을 입력하세요"
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="content">내용</label>
            <textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="내용을 입력하세요"
              rows="10"
              required
            />
          </div>
          
          <div className="form-actions">
            <button 
              type="button" 
              className="cancel-btn"
              onClick={() => navigate(-1)}
            >
              취소
            </button>
            <button 
              type="submit" 
              className="submit-btn"
              disabled={loading}
            >
              {loading ? '작성 중...' : '작성 완료'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreatePost;