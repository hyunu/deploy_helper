import { useState, useRef, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getApp, updateApp } from '../api/apps'
import apiClient from '../api/client'
import { X, FileText, Upload, Globe, Lock, Loader2 } from 'lucide-react'

interface AppSettingsModalProps {
  appId: string
  isOpen: boolean
  onClose: () => void
}

export default function AppSettingsModal({ appId, isOpen, onClose }: AppSettingsModalProps) {
  const queryClient = useQueryClient()
  const [manualFile, setManualFile] = useState<File | null>(null)
  const manualFileInputRef = useRef<HTMLInputElement>(null)
  const [isSaving, setIsSaving] = useState(false)

  const { data: app, isLoading } = useQuery({
    queryKey: ['app', appId],
    queryFn: () => getApp(appId),
    enabled: isOpen && !!appId,
  })

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    icon_url: '',
    is_public: true,
    manual_file_name: '',
    manual_file_path: '',
  })

  useEffect(() => {
    if (app) {
      setFormData({
        name: app.name,
        description: app.description || '',
        icon_url: app.icon_url || '',
        is_public: app.is_public ?? true,
        manual_file_path: app.manual_file_path || '',
        manual_file_name: app.manual_file_name || '',
      })
      setManualFile(null)
    }
  }, [app])

  const updateMutation = useMutation({
    mutationFn: () => updateApp(appId, {
      app_id: appId,
      name: formData.name,
      description: formData.description,
      icon_url: formData.icon_url,
      is_public: formData.is_public,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['app', appId] })
      queryClient.invalidateQueries({ queryKey: ['apps'] })
      setIsSaving(false)
      alert('설정이 저장되었습니다.')
      onClose()
    },
    onError: () => {
      setIsSaving(false)
      alert('저장에 실패했습니다.')
    },
  })

  const handleSave = async () => {
    setIsSaving(true)
    
    // 설명서 파일이 있으면 먼저 업로드
    if (manualFile) {
      try {
        const uploadFormData = new FormData()
        uploadFormData.append('file', manualFile)
        
        const response = await apiClient.post(`/apps/${appId}/manual`, uploadFormData, {
          headers: {
            'Content-Type': undefined,
          },
        })
        
        if (response.data?.file_name) {
          setFormData(prev => ({
            ...prev,
            manual_file_name: response.data.file_name,
            manual_file_path: response.data.file_path || prev.manual_file_path
          }))
        }
        
        await queryClient.invalidateQueries({ queryKey: ['app', appId] })
        setManualFile(null)
      } catch (error: any) {
        setIsSaving(false)
        alert(error.response?.data?.detail || '설명서 파일 업로드에 실패했습니다.')
        return
      }
    }
    
    // 앱 정보 업데이트
    updateMutation.mutate()
  }

  const handleManualFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setManualFile(e.target.files[0])
    }
  }

  const handleRemoveManualFile = () => {
    setManualFile(null)
    if (manualFileInputRef.current) {
      manualFileInputRef.current.value = ''
    }
  }

  const handleDeleteManualFile = async () => {
    if (!formData.manual_file_name) return
    
    if (!confirm(`등록된 설명서 파일 "${formData.manual_file_name}"을 삭제하시겠습니까?`)) {
      return
    }
    
    try {
      await apiClient.delete(`/apps/${appId}/manual`)
      await queryClient.invalidateQueries({ queryKey: ['app', appId] })
      setFormData(prev => ({
        ...prev,
        manual_file_path: '',
        manual_file_name: ''
      }))
      alert('설명서 파일이 삭제되었습니다.')
    } catch (error: any) {
      alert(error.response?.data?.detail || '설명서 파일 삭제에 실패했습니다.')
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:p-0">
        <div
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          onClick={onClose}
        ></div>
        
        <div className="relative bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          {/* 헤더 */}
          <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
            <h3 className="text-lg font-semibold text-gray-900">앱 설정</h3>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* 내용 */}
          <div className="p-6 space-y-6">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              </div>
            ) : (
              <>
                {/* 기본 정보 */}
                <div className="bg-gray-50 rounded-xl border border-gray-200 p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">기본 정보</h2>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">앱 이름</label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">간단한 설명</label>
                      <input
                        type="text"
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        placeholder="앱에 대한 한 줄 설명"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">앱 아이콘 URL</label>
                      <input
                        type="url"
                        value={formData.icon_url}
                        onChange={(e) => setFormData({ ...formData, icon_url: e.target.value })}
                        placeholder="https://example.com/icon.png"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                      {formData.icon_url && (
                        <img
                          src={formData.icon_url}
                          alt="Icon"
                          className="mt-2 w-16 h-16 rounded-xl object-cover border"
                          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                        />
                      )}
                    </div>
                  </div>
                </div>

                {/* 공개 설정 */}
                <div className="bg-gray-50 rounded-xl border border-gray-200 p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">공개 설정</h2>
                  <div className="flex items-center justify-between p-4 bg-white rounded-lg">
                    <div className="flex items-center gap-3">
                      {formData.is_public ? (
                        <Globe className="w-6 h-6 text-green-600" />
                      ) : (
                        <Lock className="w-6 h-6 text-gray-400" />
                      )}
                      <div>
                        <p className="font-medium text-gray-900">
                          {formData.is_public ? '공개 페이지 활성화' : '공개 페이지 비활성화'}
                        </p>
                        <p className="text-sm text-gray-500">
                          {formData.is_public ? '누구나 앱 상세 페이지를 볼 수 있습니다.' : '비공개 상태입니다.'}
                        </p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.is_public}
                        onChange={(e) => setFormData({ ...formData, is_public: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                  {formData.is_public && (
                    <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                      <p className="text-sm text-blue-800">
                        <span className="font-medium">공개 URL:</span>{' '}
                        <a href={`/p/${appId}`} target="_blank" rel="noopener noreferrer" className="underline">
                          {window.location.origin}/p/{appId}
                        </a>
                      </p>
                    </div>
                  )}
                </div>

                {/* 설명서 파일 */}
                <div className="bg-gray-50 rounded-xl border border-gray-200 p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    설명서 파일
                  </h2>
                  <div className="space-y-4">
                    {formData.manual_file_name && !manualFile && (
                      <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <FileText className="w-5 h-5 text-green-600" />
                            <div>
                              <p className="font-medium text-green-900">{formData.manual_file_name}</p>
                              <p className="text-sm text-green-700">✓ 등록된 설명서 파일</p>
                            </div>
                          </div>
                          <button
                            onClick={handleDeleteManualFile}
                            className="px-3 py-1.5 text-sm bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-2"
                          >
                            <X className="w-4 h-4" />
                            삭제
                          </button>
                        </div>
                      </div>
                    )}
                    
                    {!formData.manual_file_name && !manualFile && (
                      <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                        <div className="flex items-center gap-3">
                          <FileText className="w-5 h-5 text-yellow-600" />
                          <div>
                            <p className="text-sm text-yellow-800">설명서 파일이 등록되지 않았습니다.</p>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {manualFile && (
                      <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <FileText className="w-5 h-5 text-blue-600" />
                            <div>
                              <p className="font-medium text-blue-900">{manualFile.name}</p>
                              <p className="text-sm text-blue-700">새로 업로드할 파일 (저장 시 적용됩니다)</p>
                            </div>
                          </div>
                          <button
                            onClick={handleRemoveManualFile}
                            className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    )}

                    <div>
                      <input
                        ref={manualFileInputRef}
                        type="file"
                        accept=".pdf,.doc,.docx"
                        onChange={handleManualFileChange}
                        className="hidden"
                        id="manual-file-input"
                      />
                      <label
                        htmlFor="manual-file-input"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 cursor-pointer transition-colors"
                      >
                        <Upload className="w-4 h-4" />
                        {manualFile || formData.manual_file_name ? '파일 변경' : '설명서 파일 업로드'}
                      </label>
                      <p className="mt-2 text-xs text-gray-500">
                        PDF, DOC, DOCX 형식의 설명서 파일을 업로드할 수 있습니다.
                      </p>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* 푸터 */}
          <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
            >
              취소
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              저장
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
