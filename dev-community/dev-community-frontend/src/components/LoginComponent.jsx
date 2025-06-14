// LoginComponent.jsx

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './LoginStyles.css';

// axios.defaults.withCredentials = true;

const LoginComponent = () => {
  const passwordRegex = /^(?=.*[a-z])(?=(?:.*[A-Z]){1,})(?=.*\d)(?=.*[^A-Za-z0-9]).{8,20}$/;
  const navigate = useNavigate();
  const [showLogin, setShowLogin] = useState(true);
  
  const [InputId, setLoginId] = useState('');
  const [InputPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  
  const [signupPassword, setSignupPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [signupError, setSignupError] = useState('');
  const [email, setEmail] = useState('');
  const [id, setSignupId] = useState('');
  const [isEmailValid, setIsEmailValid] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [isVerified, setIsVerified] = useState(false);
  const [isPasswordValid, setIsPasswordValid] = useState(false);
  
  const [alert, setAlert] = useState('');
  
  useEffect(() => {
    if (alert) {
      const timer = setTimeout(() => {
        setAlert('');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [alert]);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (InputId === 'test' && InputPassword === 'test') {
      setAlert('로그인 성공! (테스트 모드)');
      setLoginError('');
      // ★★★ 수정: userId 대신 id로 저장 ★★★
      localStorage.setItem('user', JSON.stringify({
        id: 1, // 테스트 유저의 id
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

      console.log("1. Axios POST response status:", response.status);
      console.log("2. Axios POST response data:", response.data);

      if (response.status === 200) {
        setLoginError('');
        setAlert('로그인 성공!');
        
        // 서버 응답에서 id, loginId, nickname 직접 추출
        const { id, loginId, nickname } = response.data;

        console.log("3. Extracted ID:", id);
        console.log("4. Extracted LoginId:", loginId);
        console.log("5. Extracted Nickname:", nickname);

        if (typeof id === 'undefined' || id === null) {
            console.error("Critical Error: 'id' is undefined or null from server response.");
            setLoginError('로그인 정보를 가져오는 데 실패했습니다: 사용자 ID를 찾을 수 없습니다.');
            return; 
        }

        // ★★★ 수정: userId 대신 id로 저장 ★★★
        localStorage.setItem('user', JSON.stringify({
          id: id, // 서버에서 받은 'id'를 그대로 저장
          loginId: loginId,
          nickname: nickname,
          profileImageUrl: "https://play-lh.googleusercontent.com/38AGKCqmbjZ9OuWx4YjssAz3Y0DTWbiM5HB0ove1pNBq_o9mtWfGszjZNxZdwt_vgHo=w240-h480-rw"
        }));

        console.log("6. Stored in localStorage:", localStorage.getItem('user'));

        navigate('/main');
        console.log("7. Navigating to /main");

      }
    } catch (error) {
      if (error.response?.status === 401) {
        setLoginError('아이디 또는 비밀번호를 확인하세요.');
      } else {
        setLoginError('아이디 또는 비밀번호를 확인하세요.');
      }
      console.error("Login API Call Error:", error.response || error);
    }
  };
  
  const handleSignup = async (e) => {
    e.preventDefault();
    if (!passwordRegex.test(signupPassword)) {
      setSignupError('비밀번호 조건을 확인해주세요. (8~20자의 영문 대/소문자, 숫자, 특수문자 포함)');
      return;
    }
    if (!isVerified) {
      setSignupError('이메일 인증이 필요합니다.');
      return;
    }

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
      console.error("Signup Error:", error.response || error);
    }
  };
  
  const toggleForm = () => {
    setShowLogin(!showLogin);
    setEmail('');
    setSignupId('');
    setIsEmailValid(false);
    setVerificationSent(false);
    setVerificationCode('');
    setIsVerified(false);
    setLoginError('');
    setSignupError('');
    setSignupPassword('');
    setNickname('');
  };
  
  const handleEmailChange = (e) => {
    const inputEmail = e.target.value;
    setEmail(inputEmail);
    setIsEmailValid(inputEmail.endsWith('@sogang.ac.kr'));
  };
  
  const sendVerificationCode = async (e) => {
    e.preventDefault();
    if (isEmailValid) {
      try {
        if (email === 'test@sogang.ac.kr') {
          setVerificationSent(true);
          setAlert('인증번호가 전송되었습니다. (테스트 코드: 1234)');
          return;
        }

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
        console.error("Email Verification Send Error:", error.response || error);
      }
    }
  };

  const verifyCode = async () => {
    try {
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
      console.error("Email Verification Check Error:", error.response || error);
    }
  };

  return (
    <div className="login">
      {alert && <div className="alert">{alert}</div>}
      <div className="login__content">
        <div className="login__img">
          <img src="https://image.freepik.com/free-vector/code-typing-concept-illustration_114360-3581.jpg" alt="user login" />
        </div>
        <div className="login__forms">
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
                  onChange={e => setLoginPassword(e.target.value)}
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
                type="button"
                className={`verify-btn ${isEmailValid ? 'active' : 'disabled'}`}
                onClick={sendVerificationCode}
                disabled={!isEmailValid || verificationSent}
              >
                {verificationSent ? '전송됨' : '인증번호 전송'}
              </button>
            </div>
            
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
            
            <div className="login__box">
              <i className='bx bx-lock login__icon'></i>
              <input
                type="password"
                placeholder="Password"
                className="login__input"
                value={signupPassword}
                onChange={e => {
                  const pw = e.target.value;
                  setSignupPassword(pw);
                  setIsPasswordValid(passwordRegex.test(pw));
                }}
                required
              />
            </div>
            {signupPassword && !isPasswordValid && (
              <div className="login__error password-warning">
                8~20자의 영문 대/소문자, 숫자, 특수문자를 사용해 주세요.
              </div>
            )}
            
            {signupError && <div className="login__error">{signupError}</div>}
            
            <button 
              type="submit" 
              className="login__button" 
              disabled={!isVerified || !isPasswordValid}
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