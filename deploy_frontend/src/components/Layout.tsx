import { Outlet, Link, useLocation } from 'react-router-dom'
import { useAuthStore } from '../stores/auth'
import { LayoutDashboard, Package, LogOut, Upload, Users } from 'lucide-react'

export default function Layout() {
  const location = useLocation()
  const { user, logout } = useAuthStore()
  
  const navigation = [
    { name: '대시보드', href: '/dashboard', icon: LayoutDashboard },
    { name: '앱 관리', href: '/apps', icon: Package },
  ]
  
  const isActive = (href: string) => {
    return location.pathname.startsWith(href)
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* 사이드바 */}
      <div className="fixed inset-y-0 left-0 w-64 bg-white border-r border-gray-200">
        <div className="flex flex-col h-full">
          {/* 로고 */}
          <div className="flex items-center h-16 px-6 border-b border-gray-200">
            <Upload className="w-8 h-8 text-blue-600" />
            <span className="ml-2 text-xl font-bold text-gray-900">
              Deploy Helper
            </span>
          </div>
          
          {/* 네비게이션 */}
          <nav className="flex-1 px-4 py-4 space-y-1">
            {navigation.map((item) => {
              const Icon = item.icon
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                    isActive(item.href)
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <Icon className="w-5 h-5 mr-3" />
                  {item.name}
                </Link>
              )
            })}
          </nav>
          
          {/* 사용자 정보 */}
          <div className="p-4 border-t border-gray-200">
            {user?.is_admin && (
              <Link
                to="/users"
                className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors mb-2 ${
                  isActive('/users')
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <Users className="w-5 h-5 mr-3" />
                사용자 관리
              </Link>
            )}
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {user?.email}
                </p>
                <p className="text-xs text-gray-500">
                  {user?.is_admin ? '관리자' : '사용자'}
                </p>
              </div>
              <button
                onClick={logout}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                title="로그아웃"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* 메인 컨텐츠 */}
      <div className="pl-64">
        <main className="p-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
