import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useParams, Link } from 'react-router-dom'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import {
  getApp,
  getVersions,
  activateVersion,
  deactivateVersion,
  deleteVersion,
  updateVersion,
} from '../api/apps'
import {
  ArrowLeft,
  Upload,
  Download,
  Check,
  X,
  Trash2,
  AlertTriangle,
  Clock,
  Edit,
  ExternalLink,
} from 'lucide-react'

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

export default function AppDetailPage() {
  const { appId } = useParams<{ appId: string }>()
  const queryClient = useQueryClient()
  const [editingVersionId, setEditingVersionId] = useState<number | null>(null)
  const [editNotes, setEditNotes] = useState('')
  
  const { data: app, isLoading: appLoading } = useQuery({
    queryKey: ['app', appId],
    queryFn: () => getApp(appId!),
    enabled: !!appId,
  })
  
  const { data: versionsData, isLoading: versionsLoading } = useQuery({
    queryKey: ['versions', appId],
    queryFn: () => getVersions(appId!),
    enabled: !!appId,
  })
  
  const activateMutation = useMutation({
    mutationFn: (versionId: number) => activateVersion(appId!, versionId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['versions', appId] }),
  })
  
  const deactivateMutation = useMutation({
    mutationFn: (versionId: number) => deactivateVersion(appId!, versionId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['versions', appId] }),
  })
  
  const deleteMutation = useMutation({
    mutationFn: (versionId: number) => deleteVersion(appId!, versionId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['versions', appId] }),
  })
  
  const updateMutation = useMutation({
    mutationFn: ({ versionId, releaseNotes }: { versionId: number; releaseNotes: string }) =>
      updateVersion(appId!, versionId, { release_notes: releaseNotes }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['versions', appId] })
      setEditingVersionId(null)
    },
  })
  
  const handleDelete = (versionId: number, version: string) => {
    if (confirm(`버전 ${version}을(를) 삭제하시겠습니까?`)) {
      deleteMutation.mutate(versionId)
    }
  }

  const startEditing = (versionId: number, currentNotes: string | null) => {
    setEditingVersionId(versionId)
    setEditNotes(currentNotes || '')
  }

  const cancelEditing = () => {
    setEditingVersionId(null)
    setEditNotes('')
  }

  const handleUpdateNotes = (versionId: number) => {
    updateMutation.mutate({ versionId, releaseNotes: editNotes })
  }
  
  if (appLoading || versionsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }
  
  if (!app) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">앱을 찾을 수 없습니다</p>
      </div>
    )
  }
  
  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            to="/apps"
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{app.name}</h1>
            <p className="text-sm text-gray-500 font-mono">{app.app_id}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <a
            href={`/p/${appId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center px-4 py-2 text-gray-700 bg-white border border-gray-300 text-sm font-medium rounded-lg hover:bg-gray-50"
          >
            <ExternalLink className="w-5 h-5 mr-2" />
            공개 페이지
          </a>
          <Link
            to={`/apps/${appId}/edit`}
            className="inline-flex items-center px-4 py-2 text-gray-700 bg-white border border-gray-300 text-sm font-medium rounded-lg hover:bg-gray-50"
          >
            <Edit className="w-5 h-5 mr-2" />
            페이지 편집
          </Link>
          <Link
            to={`/apps/${appId}/upload`}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700"
          >
            <Upload className="w-5 h-5 mr-2" />
            새 버전 업로드
          </Link>
        </div>
      </div>
      
      {/* 버전 목록 */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            버전 목록 ({versionsData?.total || 0})
          </h2>
        </div>
        
        {versionsData?.versions && versionsData.versions.length > 0 ? (
          <div className="divide-y divide-gray-200">
            {versionsData.versions.map((version) => (
              <div
                key={version.id}
                className={`px-6 py-4 ${!version.is_active ? 'bg-gray-50' : ''}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-semibold text-gray-900">
                          v{version.version}
                        </span>
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                            version.channel === 'stable'
                              ? 'bg-green-100 text-green-800'
                              : version.channel === 'beta'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {version.channel}
                        </span>
                        {version.is_mandatory && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                            <AlertTriangle className="w-3 h-3 mr-1" />
                            필수
                          </span>
                        )}
                        {!version.is_active && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-200 text-gray-600">
                            비활성
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                        <span>{version.file_name}</span>
                        <span>{formatBytes(version.file_size)}</span>
                        <span className="flex items-center">
                          <Download className="w-4 h-4 mr-1" />
                          {version.download_count.toLocaleString()}
                        </span>
                        <span className="flex items-center">
                          <Clock className="w-4 h-4 mr-1" />
                          {format(new Date(version.created_at), 'PPP', { locale: ko })}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {version.is_active ? (
                      <button
                        onClick={() => deactivateMutation.mutate(version.id)}
                        className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-yellow-700 bg-yellow-100 rounded-lg hover:bg-yellow-200"
                        title="비활성화"
                      >
                        <X className="w-4 h-4 mr-1" />
                        비활성화
                      </button>
                    ) : (
                      <button
                        onClick={() => activateMutation.mutate(version.id)}
                        className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-green-700 bg-green-100 rounded-lg hover:bg-green-200"
                        title="활성화"
                      >
                        <Check className="w-4 h-4 mr-1" />
                        활성화
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(version.id, version.version)}
                      className="p-2 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50"
                      title="삭제"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
                
                <div className="mt-3">
                  {editingVersionId === version.id ? (
                    <div className="space-y-3">
                      <textarea
                        value={editNotes}
                        onChange={(e) => setEditNotes(e.target.value)}
                        className="w-full p-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none min-h-[100px]"
                        placeholder="릴리즈 노트를 입력하세요..."
                      />
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={cancelEditing}
                          className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                        >
                          취소
                        </button>
                        <button
                          onClick={() => handleUpdateNotes(version.id)}
                          disabled={updateMutation.isPending}
                          className="px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                        >
                          {updateMutation.isPending ? '저장 중...' : '저장'}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="group relative p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          {version.release_notes ? (
                            <p className="text-sm text-gray-600 whitespace-pre-wrap">
                              {version.release_notes}
                            </p>
                          ) : (
                            <p className="text-sm text-gray-400 italic">릴리즈 노트가 없습니다</p>
                          )}
                        </div>
                        <button
                          onClick={() => startEditing(version.id, version.release_notes)}
                          className="ml-2 p-2 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors flex items-center gap-1"
                          title="릴리즈 노트 편집"
                        >
                          <Edit className="w-4 h-4" />
                          <span className="text-xs font-medium">편집</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-12 text-center">
            <Upload className="w-12 h-12 text-gray-300 mx-auto" />
            <p className="mt-4 text-gray-500">등록된 버전이 없습니다</p>
            <Link
              to={`/apps/${appId}/upload`}
              className="mt-4 inline-block text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              첫 번째 버전 업로드하기
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
