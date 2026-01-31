import { useQuery } from '@tanstack/react-query'
import { useParams } from 'react-router-dom'
import { useEffect, useState, useRef } from 'react'
import { Download, AlertCircle } from 'lucide-react'
import { getPublicApp } from '../api/apps'

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// Tailwind CDN은 useEffect로 동적 로드

export default function PublicAppPage() {
  const { appId } = useParams<{ appId: string }>()
  const [tailwindLoaded, setTailwindLoaded] = useState(false)
  const landingPageRef = useRef<HTMLDivElement>(null)

  const {
    data: app,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['publicApp', appId],
    queryFn: () => getPublicApp(appId!),
    enabled: !!appId,
    retry: false,
  })

  // Tailwind CDN 동적 로드 (detail_html에 tailwind 클래스가 있는 경우)
  useEffect(() => {
    if (app?.detail_html && !tailwindLoaded) {
      // Tailwind 클래스가 있는지 확인
      const hasTailwindClasses = /class=["'][^"']*\b(bg-|text-|p-|m-|flex|grid|rounded|shadow|hover:|focus:)/.test(app.detail_html)
      
      if (hasTailwindClasses) {
        const existingScript = document.querySelector('script[src*="tailwindcss"]')
        if (existingScript) {
          setTailwindLoaded(true)
          return
        }
        
        const script = document.createElement('script')
        script.src = 'https://cdn.tailwindcss.com'
        script.onload = () => setTailwindLoaded(true)
        document.head.appendChild(script)
      }
    }
  }, [app?.detail_html, tailwindLoaded])

  // 상단 고정 요소만 제거 (사용자가 작성한 HTML/CSS는 그대로 유지)
  useEffect(() => {
    if (landingPageRef.current && app?.detail_html) {
      const removeFixedHeader = () => {
        const el = landingPageRef.current
        if (!el) return

        // body 직계 자식 중 고정된 헤더만 제거 (시스템 레벨)
        const bodyFirstChild = document.body.firstElementChild
        if (bodyFirstChild && bodyFirstChild !== el) {
          const style = window.getComputedStyle(bodyFirstChild)
          if (style.position === 'fixed' || style.position === 'sticky') {
            bodyFirstChild.remove()
          }
        }
      }

      removeFixedHeader()
      setTimeout(removeFixedHeader, 100)
    }
  }, [app?.detail_html])

  const handleDownload = () => {
    if (app?.download_url) {
      window.location.href = app.download_url
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (error || !app) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-gray-300 mx-auto" />
          <h1 className="mt-4 text-xl font-semibold text-gray-900">
            앱을 찾을 수 없습니다
          </h1>
          <p className="mt-2 text-gray-500">
            요청하신 앱이 존재하지 않거나 비공개 상태입니다.
          </p>
        </div>
      </div>
    )
  }

  // 사용자가 작성한 HTML과 CSS를 그대로 표시
  // detail_html이 있으면 그것을 그대로 렌더링하고, custom_css를 적용
  if (app.detail_html) {
    return (
      <>
        {/* 사용자가 작성한 CSS 적용 */}
        {app.custom_css && <style>{app.custom_css}</style>}
        
        {/* 상단 고정 요소만 제거 (시스템 레벨) */}
        <style>{`
          /* body 직계 자식 중 고정 요소만 제거 */
          body > header[style*="fixed"],
          body > header[style*="sticky"],
          body > div:first-child[style*="fixed"],
          body > div:first-child[style*="sticky"] {
            display: none !important;
          }
        `}</style>
        
        <div
          ref={landingPageRef}
          dangerouslySetInnerHTML={{ __html: app.detail_html }}
        />
        <footer className="py-6 text-center text-sm text-gray-400 bg-gray-100">
          Powered by Deploy Helper
        </footer>
      </>
    )
  }

  // detail_html이 없는 경우 기본 레이아웃
  return (
    <>
      {/* 커스텀 CSS 적용 */}
      {app.custom_css && <style>{app.custom_css}</style>}

      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="bg-white rounded-xl shadow-sm p-8 text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">{app.name}</h1>
            {app.description && (
              <p className="text-lg text-gray-600 mb-8">{app.description}</p>
            )}

            {app.latest_version ? (
              <div className="space-y-4">
                <p className="text-sm text-gray-500">
                  최신 버전: <span className="font-semibold">v{app.latest_version}</span>
                  {app.file_size && (
                    <span className="ml-2">({formatBytes(app.file_size)})</span>
                  )}
                </p>
                <button
                  onClick={handleDownload}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Download className="w-5 h-5" />
                  다운로드
                </button>
              </div>
            ) : (
              <p className="text-sm text-gray-500">아직 배포된 버전이 없습니다.</p>
            )}
          </div>
        </div>

        <footer className="mt-12 py-8 border-t border-gray-200">
          <div className="max-w-4xl mx-auto px-4 text-center text-sm text-gray-400">
            Powered by Deploy Helper
          </div>
        </footer>
      </div>
    </>
  )
}
