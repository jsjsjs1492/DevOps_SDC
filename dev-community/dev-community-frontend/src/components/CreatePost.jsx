import React, { useState, useRef, useEffect } from 'react';
import { Editor } from '@toast-ui/react-editor';
import '@toast-ui/editor/dist/toastui-editor.css';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './CreatePostStyles.css';
import './TagStyles.css';
import tags from '../data/tags';

const CreatePost = () => {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [selectedTags, setSelectedTags] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const editorRef = useRef(null);

  useEffect(() => {
    const instance = editorRef.current?.getInstance();
    if (instance) {
      setContent(instance.getMarkdown());
    }
  }, []);

  const handleTagClick = (tag) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter(t => t !== tag));
    } else if (selectedTags.length < 5) {
      setSelectedTags([...selectedTags, tag]);
    } else {
      alert('태그는 최대 5개까지 선택 가능합니다.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!title.trim() || !content.trim()) {
      alert('제목과 내용을 모두 입력해주세요.');
      return;
    }

    if (selectedTags.length === 0) {
      alert('태그를 최소 1개 이상 선택해주세요.');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await axios.post('/post', {
        title,
        content,
        tags: selectedTags
      });

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
            <Editor
              ref={editorRef}
              previewStyle="vertical"
              height="300px"
              initialEditType="wysiwyg"
              hideModeSwitch
              useCommandShortcut
              onChange={() => {
                const md = editorRef.current.getInstance().getMarkdown();
                setContent(md);
              }}
            />
          </div>

          <div className="form-group">
            <label className="tags-title">태그 선택 (최대 5개)</label>
            <div className="tags-list">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className={`tag-item ${selectedTags.includes(tag) ? 'selected' : ''}`}
                  onClick={() => handleTagClick(tag)}
                >
                  {tag}
                </span>
              ))}
            </div>
            {selectedTags.length > 0 && (
              <div className="selected-tags">
                <span>선택된 태그:</span>
                {selectedTags.map((tag) => (
                  <span key={tag} className="selected-tag">
                    {tag}
                    <span className="remove-tag" onClick={() => handleTagClick(tag)}>×</span>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="form-actions">
            <button type="submit" className="submit-button">작성하기</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreatePost;
