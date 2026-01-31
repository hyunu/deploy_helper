import { useState, useRef } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { uploadVersion } from '../api/apps'
import { ArrowLeft, Upload, X, Loader2, CheckCircle } from 'lucide-react'

export default function UploadPage() {
  const { appId } = useParams<{ appId: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [version, setVersion] = useState('')
  const [channel, setChannel] = useState<'stable' | 'beta' | 'alpha'>('stable')
  const [releaseNotes, setReleaseNotes] = useState('')
  const [isMandatory, setIsMandatory] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [dragActive, setDragActive] = useState(false)
  
  const uploadMutation = useMutation({
    mutationFn: async () => {
      if (!file) throw new Error('파일을 선택해주세요')
      
      const formData = new FormData()
      formData.append('version', version)
      formData.append('channel', channel)
      formData.append('release_notes', releaseNotes)
      formData.append('is_mandatory', String(isMandatory))
      formData.append('file', file)
      
      return uploadVersion(appId!, formData)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['versions', appId] })
      navigate(`/apps/${appId}`)
    },
  })
  
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }
  
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0])
    }
  }
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
    }
  }
  
  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    uploadMutation.mutate()
  }
  
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* 헤더 */}
      <div className="flex items-center gap-4">
        <Link
          to={`/apps/${appId}`}
          className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">새 버전 업로드</h1>
          <p className="text-sm text-gray-500 font-mono">{appId}</p>
        </div>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 파일 업로드 */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            설치 파일
          </label>
          
          {file ? (
            <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-6 h-6 text-green-600" />
                <div>
                  <p className="font-medium text-gray-900">{file.name}</p>
                  <p className="text-sm text-gray-500">{formatBytes(file.size)}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setFile(null)}
                className="p-2 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors ${
                dragActive
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              <Upload className="w-12 h-12 text-gray-400 mx-auto" />
              <p className="mt-4 text-gray-600">
                파일을 드래그하거나 클릭하여 선택하세요
              </p>
              <p className="mt-2 text-sm text-gray-400">
                .exe, .msi, .zip 파일 지원 (최대 500MB)
              </p>
            </div>
          )}
          
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileChange}
            accept=".exe,.msi,.zip"
            className="hidden"
          />
        </div>
        
        {/* 버전 정보 */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                버전
              </label>
              <input
                type="text"
                required
                value={version}
                onChange={(e) => setVersion(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="1.0.0"
              />
              <p className="mt-1 text-xs text-gray-500">
                Semantic Versioning 권장 (예: 1.0.0)
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                채널
              </label>
              <select
                value={channel}
                onChange={(e) => setChannel(e.target.value as 'stable' | 'beta' | 'alpha')}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="stable">Stable (정식)</option>
                <option value="beta">Beta (베타)</option>
                <option value="alpha">Alpha (알파)</option>
              </select>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              릴리스 노트
            </label>
            <textarea
              value={releaseNotes}
              onChange={(e) => setReleaseNotes(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={5}
              placeholder="이 버전에서 변경된 내용을 입력하세요..."
            />
          </div>
          
          <div className="flex items-center">
            <input
              type="checkbox"
              id="mandatory"
              checked={isMandatory}
              onChange={(e) => setIsMandatory(e.target.checked)}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="mandatory" className="ml-2 text-sm text-gray-700">
              필수 업데이트로 지정
            </label>
            <span className="ml-2 text-xs text-gray-500">
              (사용자가 이 버전으로 반드시 업데이트해야 함)
            </span>
          </div>
        </div>
        
        {/* 에러 메시지 */}
        {uploadMutation.isError && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
            업로드 중 오류가 발생했습니다. 다시 시도해주세요.
          </div>
        )}
        
        {/* 제출 버튼 */}
        <div className="flex justify-end gap-3">
          <Link
            to={`/apps/${appId}`}
            className="px-6 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
          >
            취소
          </Link>
          <button
            type="submit"
            disabled={!file || !version || uploadMutation.isPending}
            className="inline-flex items-center px-6 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {uploadMutation.isPending ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                업로드 중...
              </>
            ) : (
              <>
                <Upload className="w-5 h-5 mr-2" />
                업로드
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
