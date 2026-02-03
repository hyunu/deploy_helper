import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { getApps, createApp, deleteApp, CreateAppRequest } from '../api/apps'
import { Plus, Trash2, ExternalLink, Package, Loader2, Settings } from 'lucide-react'
import AppSettingsModal from '../components/AppSettingsModal'

export default function AppsPage() {
  const queryClient = useQueryClient()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [settingsAppId, setSettingsAppId] = useState<string | null>(null)
  const [newApp, setNewApp] = useState<CreateAppRequest>({
    app_id: '',
    name: '',
    description: '',
    group: '',
  })
  
  const { data: appsData, isLoading } = useQuery({
    queryKey: ['apps'],
    queryFn: getApps,
  })
  
  const createMutation = useMutation({
    mutationFn: createApp,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['apps'] })
      setIsModalOpen(false)
      setNewApp({ app_id: '', name: '', description: '', group: '' })
    },
  })
  
  const deleteMutation = useMutation({
    mutationFn: deleteApp,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['apps'] })
    },
  })
  
  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault()
    createMutation.mutate(newApp)
  }
  
  const handleDelete = (appId: string) => {
    if (confirm('정말로 이 앱을 삭제하시겠습니까? 모든 버전도 함께 삭제됩니다.')) {
      deleteMutation.mutate(appId)
    }
  }
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">앱 관리</h1>
          <p className="mt-1 text-sm text-gray-500">
            배포할 애플리케이션을 관리하세요
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <Plus className="w-5 h-5 mr-2" />
          새 앱 등록
        </button>
      </div>
      
      {/* 앱 목록 */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {appsData?.apps.length === 0 ? (
          <div className="col-span-full bg-white rounded-xl border border-gray-200 p-12 text-center">
            <Package className="w-12 h-12 text-gray-300 mx-auto" />
            <p className="mt-4 text-gray-500">등록된 앱이 없습니다</p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="mt-4 text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              첫 번째 앱 등록하기
            </button>
          </div>
        ) : (
          appsData?.apps.map((app) => (
            <div
              key={app.id}
              className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold text-gray-900 truncate">
                    {app.name}
                  </h3>
                  <p className="text-sm text-gray-500 font-mono mt-1">
                    {app.app_id}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setSettingsAppId(app.app_id)}
                    className="p-2 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-blue-50"
                    title="설정"
                  >
                    <Settings className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleDelete(app.app_id)}
                    className="p-2 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50"
                    title="삭제"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
              
              {app.description && (
                <p className="mt-3 text-sm text-gray-600 line-clamp-2">
                  {app.description}
                </p>
              )}
              
              <div className="mt-4 pt-4 border-t border-gray-100">
                <Link
                  to={`/apps/${app.app_id}`}
                  className="inline-flex items-center text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  버전 관리
                  <ExternalLink className="w-4 h-4 ml-1" />
                </Link>
              </div>
            </div>
          ))
        )}
      </div>
      
      {/* 모달 */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:p-0">
            <div
              className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
              onClick={() => setIsModalOpen(false)}
            ></div>
            
            <div className="relative bg-white rounded-xl shadow-xl max-w-md w-full p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                새 앱 등록
              </h3>
              
              <form onSubmit={handleCreate} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    앱 ID
                  </label>
                  <input
                    type="text"
                    required
                    value={newApp.app_id}
                    onChange={(e) => setNewApp({ ...newApp, app_id: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="com.company.myapp"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    고유한 앱 식별자 (영문, 숫자, 점 사용)
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    앱 이름
                  </label>
                  <input
                    type="text"
                    required
                    value={newApp.name}
                    onChange={(e) => setNewApp({ ...newApp, name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="My Application"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    설명 (선택)
                  </label>
                  <textarea
                    value={newApp.description}
                    onChange={(e) => setNewApp({ ...newApp, description: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                    placeholder="앱에 대한 설명..."
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    그룹 (프로젝트명) (선택)
                  </label>
                  <input
                    type="text"
                    value={newApp.group || ''}
                    onChange={(e) => setNewApp({ ...newApp, group: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="예: 프로젝트A, 팀별 앱 등"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    같은 그룹으로 지정하면 공개 페이지에서 그룹별로 표시됩니다.
                  </p>
                </div>
                
                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                  >
                    취소
                  </button>
                  <button
                    type="submit"
                    disabled={createMutation.isPending}
                    className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    {createMutation.isPending && (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    )}
                    등록
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* 설정 모달 */}
      {settingsAppId && (
        <AppSettingsModal
          appId={settingsAppId}
          isOpen={!!settingsAppId}
          onClose={() => setSettingsAppId(null)}
        />
      )}
    </div>
  )
}
