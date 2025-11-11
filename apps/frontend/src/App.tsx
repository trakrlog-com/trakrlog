import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";

import './App.css'
import { Dashboard } from './pages/app/Dashboard.tsx'
import { NotificationProvider } from './context/NotificationContext.tsx'
import { MainPage } from './pages/public/MainPage.tsx';
import PrivateRoute from './components/app/auth/PrivateRoute.tsx';
import { AuthContextProvider } from './context/AuthContext.tsx';
import Unauthorized from './pages/public/Unauthorized.tsx';
import NotFound from './pages/public/NotFound.tsx';
import Login from './pages/public/Login.tsx';
import "@fontsource/plus-jakarta-sans/400.css"; 

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthContextProvider>
      <NotificationProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<MainPage />} />
            <Route path="/unauthorized" element={<Unauthorized />} />
            <Route path="/not-found" element={<NotFound />} />
            <Route path="/login" element={<Login />} />

            <Route
              path="/dashboard"
              element={
                <PrivateRoute>
                  <Dashboard />
                </PrivateRoute>
              }
            />

            {/* Redirect all unmatched routes to /not-found */}
            <Route 
              path="*" 
              element={
                <Navigate to="/not-found" replace />
              } 
            />
          </Routes>
        </BrowserRouter>

      </NotificationProvider>
    </AuthContextProvider>
  </StrictMode>,
)
