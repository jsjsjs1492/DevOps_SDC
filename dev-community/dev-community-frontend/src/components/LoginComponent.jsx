import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './LoginStyles.css';

// Add axios default config for handling cookies
axios.defaults.withCredentials = true;

const LoginComponent = () => {
  const navigate = useNavigate();
  const [showLogin, setShowLogin] = useState(true);
  
  // States for login
  const [InputId, setLoginId] = useState('');
  const [InputPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  
  // States for signup
  const [signupPassword, setSignupPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [signupError, setSignupError] = useState('');
  const [email, setEmail] = useState('');
  const [id, setSignupId] = useState('');
  const [isEmailValid, setIsEmailValid] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [isVerified, setIsVerified] = useState(false);
  
  // Add state for alert
  const [alert, setAlert] = useState('');
  
  // Add useEffect for alert auto-dismiss
  useEffect(() => {
    if (alert) {
      const timer = setTimeout(() => {
        setAlert('');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [alert]);

  // Handle login
  const handleLogin = async (e) => {
    e.preventDefault();
    if (InputId === 'test' && InputPassword === 'test') {
      setAlert('로그인 성공! (테스트 모드)');
      setLoginError('');
      // 실제 사용자 정보 저장
      localStorage.setItem('user', JSON.stringify({
        userId: 1,
        loginId: InputId,
        nickname: '테스트유저'
      }));
      navigate('/main');
      return;
    }
    try {
      const response = await axios.post('/auth/login', {
        id: InputId,
        password: InputPassword
      });

      if (response.status === 200) {
        setLoginError('');
        setAlert('로그인 성공!');
        const { userId, loginId, nickname } = response.data;
        // 실제 사용자 정보 저장
        localStorage.setItem('user', JSON.stringify({
          userId,
          loginId,
          nickname
        }));
        navigate('/main');
      }
    } catch (error) {
      if (error.response?.status === 401) {
        setLoginError('아이디 또는 비밀번호를 확인하세요.');
      } else {
        setLoginError('아이디 또는 비밀번호를 확인하세요.');
      }
    }
  };
  
  // Handle signup
  const handleSignup = async (e) => {
    e.preventDefault();
    if (!isVerified) {
      setSignupError('이메일 인증이 필요합니다.');
      return;
    }

    // 테스트 모드: 닉네임과 패스워드가 1234일 때
    if (nickname === '1234' && signupPassword === '1234') {
      setAlert('회원가입이 완료되었습니다. (테스트 모드)');
      setShowLogin(true);
      return;
    }

    try {
      const response = await axios.post('/auth/signup', {
        id: id,
        email: email,
        password: signupPassword,
        nickname: nickname
      });

      if (response.status === 201) {
        setAlert('회원가입이 완료되었습니다.');
        setShowLogin(true);
      }
    } catch (error) {
      if (error.response) {
        switch (error.response.status) {
          case 409:
            setSignupError('이미 사용중인 이메일입니다.');
            break;
          case 400:
            setSignupError('입력 정보를 확인해주세요.');
            break;
          default:
            setSignupError('회원가입에 실패했습니다.');
        }
      }
    }
  };
  
  // Toggle between login and signup forms
  const toggleForm = () => {
    setShowLogin(!showLogin);
    // Reset states when switching forms
    setEmail('');
    setSignupId('');
    setIsEmailValid(false);
    setVerificationSent(false);
    setVerificationCode('');
    setIsVerified(false);
  };
  
  // Handle email validation
  const handleEmailChange = (e) => {
    const inputEmail = e.target.value;
    setEmail(inputEmail);
    
    // Check if email ends with @sogang.ac.kr
    setIsEmailValid(inputEmail.endsWith('@sogang.ac.kr'));
  };
  
  // Send verification code
  const sendVerificationCode = async (e) => {
    e.preventDefault();
    if (isEmailValid) {
      try {
        // Test mode for specific email
        if (email === 'test@sogang.ac.kr') {
          setVerificationSent(true);
          setAlert('인증번호가 전송되었습니다. (테스트 코드: 1234)');
          return;
        }

        // Real API call
        await axios.post('/auth/email/verify', {
          email: email
        });
        
        setVerificationSent(true);
        setAlert('인증번호가 전송되었습니다.');
      } catch (error) {
        if (error.response?.status === 400) {
          setAlert('잘못된 이메일 형식이거나 이미 인증된 이메일입니다.');
        } else {
          setAlert('인증번호 전송에 실패했습니다.');
        }
        setVerificationSent(false);
      }
    }
  };

  // Verify the code
  const verifyCode = async () => {
    try {
      // Test mode for specific email
      if (email === 'test@sogang.ac.kr' && verificationCode === '1234') {
        setIsVerified(true);
        setAlert('인증이 완료되었습니다.');
        return;
      }

      const response = await axios.post('/auth/email/check', {
        email: email,
        code: verificationCode
      });

      if (response.status === 200) {
        setIsVerified(true);
        setAlert('인증이 완료되었습니다.');
      }
    } catch (error) {
      if (error.response?.status === 400) {
        setAlert('잘못된 인증번호입니다. (코드 불일치 또는 만료)');
      } else {
        setAlert('인증에 실패했습니다.');
      }
    }
  };

  // 나머지 코드는 그대로 유지
  return (
    <div className="login">
      {alert && <div className="alert">{alert}</div>}
      <div className="login__content">
        <div className="login__img">
          <img src="https://image.freepik.com/free-vector/code-typing-concept-illustration_114360-3581.jpg" alt="user login" />
        </div>
        <div className="login__forms">
          {/* Login form */}
          <form onSubmit={handleLogin} className={`login__register ${showLogin ? 'block' : 'none'}`} id="login-in">
            <h1 className="login__title">Sign In</h1>
            <div className="login__box">
              <i className='bx bx-user login__icon'></i>
              <input 
                type="text" 
                placeholder="ID" 
                className="login__input" 
                value={InputId}
                onChange={(e) => setLoginId(e.target.value)}
                required 
              />
            </div>
            <div className="login__box">
              <i className='bx bx-lock login__icon'></i>
              <input 
                type="password" 
                placeholder="Password" 
                className="login__input" 
                value={InputPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                required 
              />
            </div>
            {loginError && <div className="login__error">{loginError}</div>}
            <a href="#" className="login__forgot">Forgot Password?</a>
            
            <button type="submit" className="login__button">Sign In</button>
            
            <div>
              <span className="login__account login__account--account">Don't Have an Account?</span>
              <span 
                className="login__signin login__signin--signup" 
                onClick={toggleForm}
              >
                Sign Up
              </span>
            </div>
          </form>
          
          {/* Create account form */}
          <form onSubmit={handleSignup} className={`login__create ${showLogin ? 'none' : 'block'}`} id="login-up">
            <h1 className="login__title">Create Account</h1>
            
            <div className="login__box">
              <i className='bx bx-user login__icon'></i>
              <input 
                type="text" 
                placeholder="ID" 
                className="login__input" 
                value={id}
                onChange={(e) => setSignupId(e.target.value)}
                required 
              />
            </div>
            
            <div className="login__box email-box">
              <i className='bx bx-at login__icon'></i>
              <input 
                type="email" 
                placeholder="Email@sogang.ac.kr" 
                className="login__input" 
                value={email}
                onChange={handleEmailChange}
                required 
              />
              <button 
                className={`verify-btn ${isEmailValid ? 'active' : 'disabled'}`}
                onClick={sendVerificationCode}
                disabled={!isEmailValid || verificationSent}
              >
                {verificationSent ? '전송됨' : '인증번호 전송'}
              </button>
            </div>
            
            {/* Verification code section remains the same */}
            {verificationSent && (
              <div className="login__box verification-box">
                <i className='bx bx-check-circle login__icon'></i>
                <input 
                  type="text" 
                  placeholder="Verification Code" 
                  className="login__input" 
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  disabled={isVerified}
                  required 
                />
                <button 
                  type="button"
                  className={`verify-btn ${isVerified ? 'verified' : 'active'}`}
                  onClick={verifyCode}
                  disabled={isVerified}
                >
                  {isVerified ? '인증완료' : '확인'}
                </button>
              </div>
            )}
            
            <div className="login__box">
              <i className='bx bx-user login__icon'></i>
              <input 
                type="text" 
                placeholder="Nickname" 
                className="login__input" 
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                required 
              />
            </div>
            
            {/* Password field and remaining form elements */}
            <div className="login__box">
              <i className='bx bx-lock login__icon'></i>
              <input 
                type="password" 
                placeholder="Password" 
                className="login__input"
                value={signupPassword}
                onChange={(e) => setSignupPassword(e.target.value)}
                required 
              />
            </div>
            
            {signupError && <div className="login__error">{signupError}</div>}
            
            <button 
              type="submit" 
              className="login__button" 
              disabled={!isVerified}
            >
              Sign Up
            </button>
            
            <div>
              <span className="login__account login__account--account">Already have an Account?</span>
              <span 
                className="login__signup login__signup--signup" 
                onClick={toggleForm}
              >
                Sign In
              </span>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LoginComponent;