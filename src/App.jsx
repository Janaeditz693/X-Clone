import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { NotificationProvider } from './context/NotificationContext';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';

// Lazy load page paths for code splitting & bundle optimization
const Home = lazy(() => import('./pages/Home'));
const Explore = lazy(() => import('./pages/Explore'));
const Notifications = lazy(() => import('./pages/Notifications'));
const Bookmarks = lazy(() => import('./pages/Bookmarks'));
const Profile = lazy(() => import('./pages/Profile'));
const Settings = lazy(() => import('./pages/Settings'));
const Admin = lazy(() => import('./pages/Admin'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const NotFound = lazy(() => import('./pages/NotFound'));
const PostDetail = lazy(() => import('./pages/PostDetail'));

const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen bg-brand-bg dark:bg-brand-darkBg">
    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-brand-blue"></div>
  </div>
);

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <NotificationProvider>
            <Toaster 
              position="top-center" 
              toastOptions={{
                duration: 3000,
                style: {
                  background: '#333',
                  color: '#fff',
                  fontSize: '14px',
                },
                success: {
                  iconTheme: {
                    primary: '#1d9bf0',
                    secondary: '#fff',
                  },
                },
              }}
            />
            <Suspense fallback={<PageLoader />}>
              <Routes>
                {/* Protected Timeline Routes */}
                <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />
                <Route path="/explore" element={<ProtectedRoute><Explore /></ProtectedRoute>} />
                <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
                <Route path="/bookmarks" element={<ProtectedRoute><Bookmarks /></ProtectedRoute>} />
                <Route path="/profile/:username" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
                <Route path="/post/:postId" element={<ProtectedRoute><PostDetail /></ProtectedRoute>} />
                
                {/* Protected Role-based Admin Route */}
                <Route path="/admin" element={<AdminRoute><Admin /></AdminRoute>} />
                
                {/* Auth Routes */}
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                
                {/* Fallback 404 Route */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </NotificationProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}
