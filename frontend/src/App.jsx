import { useState } from 'react'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { Provider } from 'react-redux';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './App.css'
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
import HomeScreen from './screens/HomeScreen';
import LoginScreen from './screens/LoginScreen';
import RegisterScreen from './screens/RegisterScreen';
import RegisterCompanyScreen from './screens/RegisterCompanyScreen';
import ProfileScreen from './screens/ProfileScreen';
import JobListScreen from './screens/JobListScreen';
import JobDetailScreen from './screens/JobDetailScreen';
import ResumeUploadScreen from './screens/ResumeUploadScreen';
import ChatbotScreen from './screens/ChatbotScreen';
import ApplicationSuccessScreen from './screens/ApplicationSuccessScreen';
import NotFoundScreen from './screens/NotFoundScreen';

// Admin Screens
import AdminDashboardScreen from './screens/admin/AdminDashboardScreen';
import AdminJobListScreen from './screens/admin/AdminJobListScreen';
import AdminJobCreateScreen from './screens/admin/AdminJobCreateScreen';
import AdminJobEditScreen from './screens/admin/AdminJobEditScreen';
import AdminJobApplicationsScreen from './screens/admin/AdminJobApplicationsScreen';
import AdminCompanyProfileScreen from './screens/admin/AdminCompanyProfileScreen';
import AdminMessagingScreen from './screens/admin/AdminMessagingScreen';

import store from './store';

function App() {
  return (
    <Provider store={store}>
      <Router>
        <div className="min-h-screen flex flex-col bg-gray-50">
          {/* Fixed Header */}
          <Header />

          {/* Main Content */}
          <main className="flex-grow">
            <Routes>
              <Route path="/" element={<HomeScreen />} exact />
              <Route path="/login" element={<LoginScreen />} />
              <Route path="/register" element={<RegisterScreen />} />
              <Route path="/register-company" element={<RegisterCompanyScreen />} />
              <Route path="/profile" element={<ProfileScreen />} />
              <Route path="/jobs" element={<JobListScreen />} />
              <Route path="/jobs/:id" element={<JobDetailScreen />} />
              <Route path="/upload-resume" element={<ResumeUploadScreen />} />
              <Route path="/chatbot/:resumeId/:jobId" element={<ChatbotScreen />} />
              <Route path="/application-success/:jobId" element={<ApplicationSuccessScreen />} />

              {/* Admin Routes */}
              <Route path="/admin/dashboard" element={<AdminDashboardScreen />} />
              <Route path="/admin/jobs" element={<AdminJobListScreen />} />
              <Route path="/admin/jobs/create" element={<AdminJobCreateScreen />} />
              <Route path="/admin/jobs/:id/edit" element={<AdminJobEditScreen />} />
              <Route path="/admin/jobs/:id/applications" element={<AdminJobApplicationsScreen />} />
              <Route path="/admin/profile" element={<AdminCompanyProfileScreen />} />
              <Route path="/admin/messaging/:jobId" element={<AdminMessagingScreen />} />

              <Route path="*" element={<NotFoundScreen />} />
            </Routes>
          </main>

          {/* Footer */}
          <Footer />

          {/* Toast Container with Improved Styling */}
          <ToastContainer
            position="top-right"
            autoClose={5000}
            hideProgressBar={false}
            newestOnTop
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
            theme="light"
            toastStyle={{
              background: 'rgba(255, 255, 255, 0.9)',
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(229, 231, 235, 0.5)',
              borderRadius: '0.75rem',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
            }}
          />
        </div>
      </Router>
    </Provider>
  )
}

export default App
