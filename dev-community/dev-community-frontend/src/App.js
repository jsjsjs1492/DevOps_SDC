import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LoginComponent from './components/LoginComponent';
import MainPage from './components/MainPage';
import PopularPosts from './components/PopularPosts';
import AllPosts from './components/AllPosts';
import PostDetail from './components/PostDetail';
import EditPost from './components/EditPost';
import MyPage from './components/MyPage';
import EditProfile from './components/EditProfile';
import ChangePassword from './components/ChangePassword';
import CreatePost from './components/CreatePost';


function App() {
  return (
   
      <Router>
        <Routes>
          <Route path="/" element={<LoginComponent />} />
          <Route path="/main" element={<MainPage />} />
          <Route path="/popular-posts" element={<PopularPosts />} />
          <Route path="/all-posts" element={<AllPosts />} />
          <Route path="/post/:id" element={<PostDetail />} />
          <Route path="/edit-post/:id" element={<EditPost />} />
          <Route path="/mypage" element={<MyPage />} />
          <Route path="/edit-profile" element={<EditProfile />} />
          <Route path="/change-password" element={<ChangePassword />} />
          <Route path="/create-post" element={<CreatePost />} />
        </Routes>
      </Router>
    
  );
}

export default App;