import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import App from './App.tsx'
import { AuthProvider } from './contexts/AuthContext'
import { PrivateRoute } from './components/Auth/PrivateRoute'
import { AuthCallback } from './components/Auth/AuthCallback'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* 認証コールバック用ルート */}
          <Route path="/auth/callback" element={<AuthCallback />} />
          
          {/* メインアプリケーション（認証保護） */}
          <Route 
            path="/*" 
            element={
              <PrivateRoute>
                <App />
              </PrivateRoute>
            } 
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  </React.StrictMode>,
)