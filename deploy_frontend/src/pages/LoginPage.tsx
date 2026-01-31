import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { useAuthStore } from '../stores/auth'
import { login, getMe } from '../api/auth'
import { Rocket, Loader2, Mail, Lock, ArrowRight } from 'lucide-react'

export default function LoginPage() {
  const navigate = useNavigate()
  const setAuth = useAuthStore((state) => state.setAuth)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  
  const loginMutation = useMutation({
    mutationFn: async () => {
      const tokenData = await login({ username: email, password })
      // 임시로 토큰 설정
      useAuthStore.getState().setAuth(tokenData.access_token, {
        id: 0,
        email: email,
        is_admin: false,
      })
      // 사용자 정보 가져오기
      const user = await getMe()
      return { token: tokenData.access_token, user }
    },
    onSuccess: (data) => {
      setAuth(data.token, {
        id: data.user.id,
        email: data.user.email,
        is_admin: data.user.is_admin,
      })
      navigate('/dashboard')
    },
    onError: () => {
      setError('이메일 또는 비밀번호가 올바르지 않습니다')
    },
  })
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    loginMutation.mutate()
  }
  
  return (
    <div className="min-h-screen flex">
      {/* 왼쪽: 브랜딩 영역 */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 p-12 flex-col justify-between relative overflow-hidden">
        {/* 배경 패턴 */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-72 h-72 bg-white rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-white rounded-full blur-3xl"></div>
        </div>
        
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center">
              <Rocket className="w-7 h-7 text-white" />
            </div>
            <span className="text-2xl font-bold text-white">Deploy Helper</span>
          </div>
        </div>
        
        <div className="relative z-10 space-y-6">
          <h1 className="text-4xl font-bold text-white leading-tight">
            소프트웨어 배포를<br />
            더 쉽고 빠르게
          </h1>
          <p className="text-lg text-blue-100 max-w-md">
            버전 관리, 자동 업데이트, 다운로드 페이지까지.
            하나의 플랫폼에서 모든 배포를 관리하세요.
          </p>
          
          <div className="flex gap-8 pt-4">
            <div>
              <div className="text-3xl font-bold text-white">100%</div>
              <div className="text-sm text-blue-200">무료 오픈소스</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-white">3분</div>
              <div className="text-sm text-blue-200">빠른 설치</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-white">멀티</div>
              <div className="text-sm text-blue-200">플랫폼 지원</div>
            </div>
          </div>
        </div>
        
        <div className="relative z-10 text-sm text-blue-200">
          © 2024 Deploy Helper. All rights reserved.
        </div>
      </div>
      
      {/* 오른쪽: 로그인 폼 */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-gray-50">
        <div className="w-full max-w-md">
          {/* 모바일에서만 보이는 로고 */}
          <div className="lg:hidden text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl mb-4">
              <Rocket className="w-9 h-9 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Deploy Helper</h1>
            <p className="text-gray-500 mt-1">소프트웨어 배포 관리 시스템</p>
          </div>
          
          <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900">
                로그인
              </h2>
              <p className="text-gray-500 mt-2">
                관리자 계정으로 로그인하세요
              </p>
            </div>
            
            <form className="space-y-5" onSubmit={handleSubmit}>
              {error && (
                <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-xl text-sm flex items-center gap-2">
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  {error}
                </div>
              )}
              
              <div className="space-y-4">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">
                    이메일
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="block w-full pl-12 pr-4 py-3.5 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-gray-900 placeholder-gray-400"
                      placeholder="admin@company.com"
                    />
                  </div>
                </div>
                
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1.5">
                    비밀번호
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="password"
                      name="password"
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="block w-full pl-12 pr-4 py-3.5 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-gray-900 placeholder-gray-400"
                      placeholder="비밀번호를 입력하세요"
                    />
                  </div>
                </div>
              </div>
              
              <button
                type="submit"
                disabled={loginMutation.isPending}
                className="w-full flex justify-center items-center gap-2 py-3.5 px-4 border border-transparent rounded-xl text-base font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40"
              >
                {loginMutation.isPending ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    로그인 중...
                  </>
                ) : (
                  <>
                    로그인
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </form>
            
            <div className="mt-6 pt-6 border-t border-gray-100">
              <p className="text-center text-sm text-gray-500">
                기본 계정: <span className="font-medium text-gray-700">admin@company.com</span> / <span className="font-medium text-gray-700">admin123</span>
              </p>
            </div>
          </div>
          
          <p className="text-center text-sm text-gray-400 mt-6">
            Deploy Helper v1.0.0
          </p>
        </div>
      </div>
    </div>
  )
}
