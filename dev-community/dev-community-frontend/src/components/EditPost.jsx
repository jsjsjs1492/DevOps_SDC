import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './EditPostStyles.css';

const EditPost = () => {
  const { id: postId } = useParams();
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const response = await axios.get(`/post/${postId}`);
        setTitle(response.data.title);
        setContent(response.data.content);
        setLoading(false);
      } catch (error) {
        console.error('게시글 정보 로딩 실패:', error);
        setError('게시글을 불러오는데 실패했습니다.');
        setLoading(false);
      }
    };

    fetchPost();
  }, [postId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!title.trim() || !content.trim()) {
      alert('제목과 내용을 모두 입력해주세요.');
      return;
    }

    try {
      // PUT 요청으로 게시글 수정
      const response = await axios.put(`/post/${postId}`, {
        title,
        content
      });
      
      // 수정 성공 시 상세 페이지로 이동
      navigate(`/post/${postId}`);
    } catch (error) {
      console.error('게시글 수정 실패:', error);
      
      // 에러 응답에 따른 처리
      if (error.response) {
        const { status } = error.response;
        if (status === 400) {
          alert('제목과 내용을 올바르게 입력해주세요.');
        } else if (status === 401) {
          alert('로그인이 필요합니다.');
          navigate('/login');
        } else if (status === 403) {
          alert('본인이 작성한 게시글만 수정할 수 있습니다.');
          navigate(`/post/${postId}`);
        } else if (status === 404) {
          alert('게시글을 찾을 수 없습니다.');
          navigate('/main');
        } else {
          alert('게시글 수정에 실패했습니다.');
        }
      } else {
        alert('게시글 수정에 실패했습니다.');
      }
    }
  };

  if (loading) return <div className="loading">Loading...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="edit-post">
      <header className="community-header">
        <button className="back-btn" onClick={() => navigate(-1)}>
          <i className="bx bx-arrow-back"></i>
        </button>
        <div className="logo-container" onClick={() => navigate("/main")}>
          <img src="https://cdn-icons-png.flaticon.com/512/2721/2721620.png" alt="Logo" className="logo-img" />
          <h1>SDC</h1>
        </div>
      </header>

      <div className="edit-post-container">
        <h1>게시글 수정</h1>
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
            <button type="button" onClick={() => navigate(-1)}>취소</button>
            <button type="submit">수정 완료</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditPost;