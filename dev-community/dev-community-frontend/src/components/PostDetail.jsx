import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './PostDetailStyles.css';

const PostDetail = () => {
  const { id: postId } = useParams(); // Rename to postId for clarity
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newComment, setNewComment] = useState('');
  const [newReply, setNewReply] = useState('');
  const [replyingTo, setReplyingTo] = useState(null);
  const [userInfo, setUserInfo] = useState(null); // Add userInfo state

  // Add useEffect to load user info from localStorage
  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        setUserInfo(JSON.parse(userStr));
      } catch (error) {
        console.error('Failed to parse user info:', error);
      }
    }
  }, []);

  useEffect(() => {
    const fetchPostDetail = async () => {
      try {
        const response = await axios.get(`/post/${postId}`);
        setPost(response.data);
        setLoading(false);
      } catch (error) {
        console.error('게시글 상세 정보 로딩 실패:', error);
        // 더미 데이터 사용
        /*setPost({
          id: parseInt(postId),
          title: "React 상태관리의 모든 것",
          content: "React에서 상태관리를 효율적으로 하는 방법을 알아봅시다...",
          author: {
            id: "user1",
            nickname: "개발왕",
            profileImageUrl: null
          },
          likeCount: 150,
          isLiked: false,
          createdAt: "2024-01-15T09:00:00",
          comments: [
            {
              id: 1,
              content: "좋은 글이네요!",
              author: "리액트러버",
              createdAt: "2024-01-15T10:00:00"
            }
          ]
        });*/
        setLoading(false);
      }
    };

    fetchPostDetail();
  }, [postId]);

  const handleEdit = () => {
    // 수정 페이지로 이동, postId 파라미터 사용
    navigate(`/edit-post/${postId}`);
  };

  const handleDelete = async () => {
    if (window.confirm('정말로 이 게시글을 삭제하시겠습니까?')) {
      try {
        // 수정된 API 엔드포인트 사용
        await axios.delete(`/post/${postId}`);
        // 삭제 성공 시 메인 페이지로 이동
        navigate('/main');
      } catch (error) {
        console.error('게시글 삭제 실패:', error);
        
        // 에러 응답에 따른 처리
        if (error.response) {
          const { status } = error.response;
          if (status === 401) {
            alert('로그인이 필요합니다.');
            navigate('/login');
          } else if (status === 403) {
            alert('본인이 작성한 게시글만 삭제할 수 있습니다.');
          } else if (status === 404) {
            alert('게시글을 찾을 수 없습니다.');
            navigate('/main');
          } else {
            alert('게시글 삭제에 실패했습니다.');
          }
        } else {
          alert('게시글 삭제에 실패했습니다.');
        }
      }
    }
  };

  const handleLike = async () => {
    try {
      // 이미 좋아요를 눌렀는지 확인
      if (post.isLiked) {
        // 좋아요 취소 로직
        await axios.delete(`/post/${postId}/like`);
        setPost(prev => ({
          ...prev,
          likeCount: prev.likeCount - 1,
          isLiked: false
        }));
      } else {
        // 좋아요 추가
        await axios.post(`/post/${postId}/like`);
        setPost(prev => ({
          ...prev,
          likeCount: prev.likeCount + 1,
          isLiked: true
        }));
      }
    } catch (error) {
      console.error('좋아요 처리 실패:', error);
      
      if (error.response) {
        const { status } = error.response;
        if (status === 400) {
          // 이미 좋아요를 누른 경우 또는 이미 취소한 경우
          alert(post.isLiked ? '이미 취소된 좋아요입니다.' : '이미 좋아요를 누르셨습니다.');
          // 서버 상태와 클라이언트 상태 동기화를 위해 게시글 정보 다시 불러오기
          const response = await axios.get(`/post/${postId}`);
          setPost(response.data);
        } else if (status === 401) {
          alert('로그인이 필요합니다.');
          navigate('/login');
        } else if (status === 404) {
          alert('게시글을 찾을 수 없습니다.');
          navigate('/main');
        }
      } else {
        alert('서버 연결에 실패했습니다.');
      }
    }
  };

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      // 댓글 작성 API 호출 - 경로는 동일하지만 응답 처리 방식 업데이트
      const response = await axios.post(`/post/${postId}/comment`, {
        content: newComment
      });
      
      // 새 댓글 객체 생성
      const newCommentObj = {
        id: response.data.id,
        content: newComment,
        author: userInfo?.nickname || '현재 사용자', // 사용자 정보가 있다면 사용
        createdAt: response.data.createdAt
      };
      
      // 댓글 목록 업데이트
      setPost(prev => ({
        ...prev,
        comments: [...prev.comments, newCommentObj]
      }));
      
      // 입력 필드 초기화
      setNewComment('');
    } catch (error) {
      console.error('댓글 작성 실패:', error);
      
      if (error.response) {
        const { status } = error.response;
        if (status === 400) {
          alert('댓글 내용을 올바르게 입력해주세요.');
        } else if (status === 401) {
          alert('로그인이 필요합니다.');
          navigate('/login');
        } else if (status === 404) {
          alert('게시글을 찾을 수 없습니다.');
          navigate('/main');
        } else {
          alert('댓글 작성에 실패했습니다.');
        }
      } else {
        alert('서버 연결에 실패했습니다.');
      }
    }
  };

  // 댓글 삭제 함수 추가
  const handleDeleteComment = async (commentId) => {
    if (!window.confirm('정말로 이 댓글을 삭제하시겠습니까?')) {
      return;
    }
    
    try {
      // 댓글 삭제 API 호출 - 새로운 엔드포인트 사용
      await axios.delete(`/comment/${commentId}`);
      
      // 댓글 목록에서 삭제된 댓글 제거
      setPost(prev => ({
        ...prev,
        comments: prev.comments.filter(comment => comment.id !== commentId)
      }));
      
      alert('댓글이 삭제되었습니다.');
    } catch (error) {
      console.error('댓글 삭제 실패:', error);
      
      if (error.response) {
        const { status } = error.response;
        if (status === 401) {
          alert('로그인이 필요합니다.');
          navigate('/login');
        } else if (status === 403) {
          alert('본인이 작성한 댓글만 삭제할 수 있습니다.');
        } else if (status === 404) {
          alert('댓글을 찾을 수 없습니다.');
          // 이미 삭제된 댓글일 수 있으므로 UI에서도 제거
          setPost(prev => ({
            ...prev,
            comments: prev.comments.filter(comment => comment.id !== commentId)
          }));
        } else {
          alert('댓글 삭제에 실패했습니다.');
        }
      } else {
        alert('서버 연결에 실패했습니다.');
      }
    }
  };

  const handleReplySubmit = async (commentId) => {
    if (!newReply.trim()) return;

    try {
      const response = await axios.post(`/comment/${commentId}/reply`, {
        content: newReply
      });
      // API 응답 구조에 맞게 댓글 업데이트 로직 수정 필요
      // 현재 API 명세에는 대댓글 관련 정보가 없으므로 기존 로직 유지
      setPost(prev => ({
        ...prev,
        comments: prev.comments.map(comment =>
          comment.id === commentId
            ? {
                ...comment,
                replies: [...(comment.replies || []), response.data]
              }
            : comment
        )
      }));
      setNewReply('');
      setReplyingTo(null);
    } catch (error) {
      console.error('답글 작성 실패:', error);
      /*const dummyReply = {
        id: Date.now(),
        content: newReply,
        author: '현재 사용자',
        createdAt: new Date().toISOString()
      };*/
      setPost(prev => ({
        ...prev,
        comments: prev.comments.map(comment =>
          comment.id === commentId
            ? {
                ...comment,
                replies: [...(comment.replies || [])/*, dummyReply*/]
              }
            : comment
        )
      }));
      setNewReply('');
      setReplyingTo(null);
    }
  };

  if (loading) return <div className="loading">Loading...</div>;
  if (error) return <div className="error">{error}</div>;
  if (!post) return <div className="error">게시글을 찾을 수 없습니다.</div>;

  return (
    <div className="post-detail">
      <header className="community-header">
        <button className="back-btn" onClick={() => navigate(-1)}>
          <i className="bx bx-arrow-back"></i>
        </button>
        <div className="logo-container" onClick={() => navigate("/main")}>
          <img src="https://cdn-icons-png.flaticon.com/512/2721/2721620.png" alt="Logo" className="logo-img" />
          <h1>SDC</h1>
        </div>
      </header>

      <div className="post-detail-container">
        <header>
          <h1>{post.title}</h1>
          <div className="post-meta">
            <span className="author">{post.author.nickname}</span>
            <span className="date">{new Date(post.createdAt).toLocaleDateString()}</span>
          </div>
          <div className="post-actions">
            <button onClick={handleEdit}>수정</button>
            <button onClick={handleDelete}>삭제</button>
          </div>
        </header>

        <main>
          <div className="post-content">
            <p>{post.content}</p>
          </div>
          
          <div className="post-likes">
            <button 
              onClick={handleLike}
              className={post.isLiked ? 'liked' : ''}
            >
              <i className={`bx ${post.isLiked ? 'bxs-like' : 'bx-like'}`}></i> 
              {post.isLiked ? '좋아요 취소' : '좋아요'}
            </button>
            <span>{post.likeCount}</span>
          </div>

          <section className="comments-section">
            <h2>댓글</h2>
            <div className="add-comment">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="댓글을 작성하세요..."
              />
              <button onClick={handleCommentSubmit}>댓글 작성</button>
            </div>

            <ul>
              {post.comments.map(comment => (
                
                <li key={comment.id}>
                  <div className="comment-header">
                    <p className="comment-author">{comment.author.nickname}</p>
                    <div className="comment-actions">
                      <button 
                        className="reply-toggle-btn"
                        onClick={() => setReplyingTo(comment.id)}
                      >
                        답글
                      </button>
                      {/* 댓글 삭제 버튼 추가 */}
                      <button 
                        className="delete-comment-btn"
                        onClick={() => handleDeleteComment(comment.id)}
                      >
                        삭제
                      </button>
                    </div>
                  </div>
                  <p>{comment.content}</p>
                  <p className="comment-date">
                    {new Date(comment.createdAt).toLocaleString()}
                  </p>
                  
                  {/* 나머지 코드 (답글 관련) 유지 */}
                  {replyingTo === comment.id && (
                    <div className="add-reply">
                      <textarea
                        value={newReply}
                        onChange={(e) => setNewReply(e.target.value)}
                        placeholder="답글을 작성하세요..."
                      />
                      <button onClick={() => handleReplySubmit(comment.id)}>
                        답글 작성
                      </button>
                    </div>
                  )}

                  {comment.replies && comment.replies.length > 0 && (
                    <div className="replies">
                      {comment.replies.map(reply => (
                        <div key={reply.id}>
                          <div className="comment-header">
                            <p className="comment-author">{reply.author}</p>
                          </div>
                          <p>{reply.content}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </section>
        </main>
      </div>
    </div>
  );
};

export default PostDetail;