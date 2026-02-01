import { useQuery } from '@tanstack/react-query'
import { useParams } from 'react-router-dom'
import { useEffect, useState, useRef } from 'react'
import { Download, AlertCircle, FileText } from 'lucide-react'
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
  const [fontLoaded, setFontLoaded] = useState(false)
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

  // 폰트 로딩 확인
  useEffect(() => {
    if (app?.detail_html && !fontLoaded) {
      // LG Smart 폰트가 로드되었는지 확인
      if ('fonts' in document) {
        const checkFont = async () => {
          try {
            await (document as any).fonts.load('400 1em "LG Smart"')
            await (document as any).fonts.load('700 1em "LG Smart"')
            setFontLoaded(true)
          } catch (e) {
            // 폰트 로드 실패 시에도 계속 진행
            setTimeout(() => setFontLoaded(true), 1000)
          }
        }
        checkFont()
      } else {
        setTimeout(() => setFontLoaded(true), 1000)
      }
    }
  }, [app?.detail_html, fontLoaded])

  // Tailwind CDN 동적 로드
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

  const handleManualDownload = () => {
    if (app?.manual_download_url) {
      window.location.href = app.manual_download_url
    }
  }

  // 아이콘이 없거나 로드 실패 시 아이콘 영역 숨기기
  useEffect(() => {
    if (landingPageRef.current && app?.detail_html) {
      const hideEmptyIconArea = () => {
        const el = landingPageRef.current
        if (!el) return

        // 아이콘 이미지 찾기
        const iconImages = el.querySelectorAll('img[src*="{{ICON_URL}}"], img[alt*="{{APP_NAME}}"], img[src=""], img:not([src])')
        
        iconImages.forEach((img) => {
          const imageElement = img as HTMLImageElement
          
          // src가 비어있거나 유효하지 않으면 부모 div 숨기기
          if (!imageElement.src || imageElement.src.trim() === '' || imageElement.src.includes('{{ICON_URL}}')) {
            const parentDiv = imageElement.closest('div[id="app-icon-container"], div.mb-8')
            if (parentDiv) {
              (parentDiv as HTMLElement).style.display = 'none'
            }
          }
          
          // 이미지 로드 실패 시 부모 div 숨기기
          imageElement.onerror = () => {
            const parentDiv = imageElement.closest('div[id="app-icon-container"], div.mb-8')
            if (parentDiv) {
              (parentDiv as HTMLElement).style.display = 'none'
            }
          }
          
          // 이미지가 로드되지 않았거나 너비/높이가 0이면 숨기기
          if (imageElement.complete && (imageElement.naturalWidth === 0 || imageElement.naturalHeight === 0)) {
            const parentDiv = imageElement.closest('div[id="app-icon-container"], div.mb-8')
            if (parentDiv) {
              (parentDiv as HTMLElement).style.display = 'none'
            }
          }
        })
      }

      hideEmptyIconArea()
      setTimeout(hideEmptyIconArea, 100)
      setTimeout(hideEmptyIconArea, 500)
      setTimeout(hideEmptyIconArea, 1000)
    }
  }, [app?.detail_html])

  // detail_html 내부의 다운로드 링크를 실제 URL로 변환
  useEffect(() => {
    if (landingPageRef.current && app) {
      const processLinks = () => {
        const el = landingPageRef.current
        if (!el) return

        // 설치파일 다운로드 링크 처리
        if (app.download_url) {
          const downloadLinks = el.querySelectorAll('a[href*="/api/update/download/latest/"]')
          downloadLinks.forEach((link) => {
            const anchor = link as HTMLAnchorElement
            anchor.href = app.download_url!
            anchor.onclick = (e) => {
              e.preventDefault()
              handleDownload()
            }
          })
        }

        // 설명서 다운로드 링크 처리
        if (app.manual_download_url) {
          const manualLinks = el.querySelectorAll('a[href*="/api/apps/public/"][href*="/manual"]')
          manualLinks.forEach((link) => {
            const anchor = link as HTMLAnchorElement
            anchor.href = app.manual_download_url!
            anchor.onclick = (e) => {
              e.preventDefault()
              handleManualDownload()
            }
          })
        }
      }

      processLinks()
      setTimeout(processLinks, 100)
      setTimeout(processLinks, 500)
    }
  }, [app?.detail_html, app?.download_url, app?.manual_download_url])

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

  // 폰트 CSS 정의 (모든 템플릿에 자동 적용)
  const fontCss = `
@font-face {
  font-family: 'LG Smart';
  font-style: normal;
  font-weight: 300;
  font-display: swap;
  src: url('/fonts/LGSmHaL.ttf') format('truetype');
}
@font-face {
  font-family: 'LG Smart';
  font-style: normal;
  font-weight: 400;
  font-display: swap;
  src: url('/fonts/LGSmHaR.ttf') format('truetype');
}
@font-face {
  font-family: 'LG Smart';
  font-style: normal;
  font-weight: 600;
  font-display: swap;
  src: url('/fonts/LGSmHaSB.ttf') format('truetype');
}
@font-face {
  font-family: 'LG Smart';
  font-style: normal;
  font-weight: 700;
  font-display: swap;
  src: url('/fonts/LGSmHaB.ttf') format('truetype');
}
body, body *, * {
  font-family: 'LG Smart', 'Noto Sans KR', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif !important;
}
h1, h2, h3, h4, h5, h6, p, div, span {
  background: transparent !important;
}
`

  // 사용자가 작성한 HTML과 CSS를 그대로 표시
  // detail_html이 있으면 그것을 그대로 렌더링하고, custom_css를 적용
  if (app.detail_html) {
    return (
      <>
        {/* 폰트 CSS 자동 적용 */}
        <style>{fontCss}</style>
        
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
        
        {/* 다운로드 버튼 영역 (설치파일 또는 설명서가 있는 경우) */}
        {(app.download_url || app.manual_download_url) && (
          <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3">
            {app.download_url && (
              <button
                onClick={handleDownload}
                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors shadow-lg"
                title="설치파일 다운로드"
              >
                <Download className="w-5 h-5" />
                <span className="hidden sm:inline">설치파일</span>
              </button>
            )}
            {app.manual_download_url && (
              <button
                onClick={handleManualDownload}
                className="inline-flex items-center gap-2 px-6 py-3 bg-gray-600 text-white font-semibold rounded-lg hover:bg-gray-700 transition-colors shadow-lg"
                title="설명서 다운로드"
              >
                <FileText className="w-5 h-5" />
                <span className="hidden sm:inline">설명서</span>
              </button>
            )}
          </div>
        )}
        
        <footer className="py-6 text-center text-sm text-gray-400 bg-gray-100">
          Powered by Deploy Helper
        </footer>
      </>
    )
  }

  // detail_html이 없는 경우 기본 레이아웃
  return (
    <>
      {/* 폰트 CSS 자동 적용 */}
      <style>{fontCss}</style>
      
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
                <div className="flex flex-wrap gap-3 justify-center">
                  <button
                    onClick={handleDownload}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Download className="w-5 h-5" />
                    설치파일 다운로드
                  </button>
                  {app.manual_download_url && (
                    <button
                      onClick={handleManualDownload}
                      className="inline-flex items-center gap-2 px-6 py-3 bg-gray-600 text-white font-semibold rounded-lg hover:bg-gray-700 transition-colors"
                    >
                      <FileText className="w-5 h-5" />
                      설명서 다운로드
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-gray-500">아직 배포된 버전이 없습니다.</p>
                {app.manual_download_url && (
                  <button
                    onClick={handleManualDownload}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-gray-600 text-white font-semibold rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    <FileText className="w-5 h-5" />
                    설명서 다운로드
                  </button>
                )}
              </div>
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
