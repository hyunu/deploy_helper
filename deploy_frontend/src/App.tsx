import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './stores/auth'
import Layout from './components/Layout'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import AppsPage from './pages/AppsPage'
import AppDetailPage from './pages/AppDetailPage'
import AppEditPage from './pages/AppEditPage'
import UploadPage from './pages/UploadPage'
import UsersPage from './pages/UsersPage'
import PublicAppPage from './pages/PublicAppPage'
import PublicAppsPage from './pages/PublicAppsPage'

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }
  
  return <>{children}</>
}

function App() {
  return (
    <Routes>
      {/* 공개 페이지 (인증 불필요) */}
      <Route path="/p/:appId" element={<PublicAppPage />} />
      <Route path="/public-apps" element={<PublicAppsPage />} />
      
      {/* 로그인 */}
      <Route path="/login" element={<LoginPage />} />
      
      {/* 관리자 페이지 (인증 필요) */}
      <Route
        path="/"
        element={
          <PrivateRoute>
            <Layout />
          </PrivateRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="apps" element={<AppsPage />} />
        <Route path="apps/:appId" element={<AppDetailPage />} />
        <Route path="apps/:appId/edit" element={<AppEditPage />} />
        <Route path="apps/:appId/upload" element={<UploadPage />} />
        <Route path="users" element={<UsersPage />} />
      </Route>
    </Routes>
  )
}

export default App
