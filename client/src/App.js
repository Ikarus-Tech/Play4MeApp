import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';

import RoleSelection from './components/RoleSelection.jsx';
import Login from './components/User/login-client.jsx';
import LoginVenue from './components/Venue/login-venue.jsx';
import Registration from './components/User/Registration.jsx';
import HomeRequest from './components/User/HomeRequest.jsx';
import RequestManager from './components/Venue/Requests-Manager.jsx';
import Playlist from './components/Venue/Playlist.jsx'
import 'bootstrap-icons/font/bootstrap-icons.css';


function App() {
  return (
    <GoogleOAuthProvider clientId="95123885049-gssvaue3rorebrdfcobfc47oeu8pv8is.apps.googleusercontent.com">
      <BrowserRouter>
        <Routes>
          <Route path='/' element={<RoleSelection />} />
          <Route path='/login' element={<Login />} />
          <Route path='/login-venue' element={<LoginVenue />} />
          <Route path='/regist' element={<Registration />} />
          <Route path='/home' element={<HomeRequest />} />
          <Route path='/request-manager' element={<RequestManager />} />
          <Route path='/playlist' element={<Playlist />} />
        </Routes>
      </BrowserRouter>
    </GoogleOAuthProvider>
  );
}

export default App;
