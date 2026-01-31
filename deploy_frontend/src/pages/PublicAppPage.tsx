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

// 기본 랜딩 페이지 CSS (항상 포함)
const landingPageCss = `
/* 풀페이지 랜딩 스타일 */
.landing-page {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
}

.lp-section {
  min-height: 100vh;
  display: flex;
  align-items: center;
  padding: 4rem 2rem;
}

.lp-container {
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
}

.lp-section-mint {
  background: linear-gradient(180deg, #e8f5e9 0%, #f1f8e9 100%);
}

.lp-section-white {
  background: #ffffff;
}

.lp-section-dark {
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
}

.lp-section-title {
  font-size: 4rem;
  font-weight: 700;
  text-align: center;
  margin-bottom: 4rem;
  color: #1a1a2e;
  text-decoration: underline;
  text-decoration-thickness: 4px;
  text-underline-offset: 8px;
}

.lp-step {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 4rem;
  align-items: center;
}

.lp-step-reverse {
  direction: rtl;
}

.lp-step-reverse > * {
  direction: ltr;
}

.lp-step-content {
  padding: 2rem;
}

.lp-step-indicator {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 2rem;
}

.lp-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #ccc;
}

.lp-dot-active {
  background: #4caf50;
}

.lp-step-number {
  font-size: 2.5rem;
  margin-bottom: 1rem;
  color: #666;
}

.lp-step-number-light {
  color: rgba(255,255,255,0.6);
}

.lp-step-title {
  font-size: 2.5rem;
  font-weight: 700;
  line-height: 1.2;
  color: #1a1a2e;
  margin-bottom: 1.5rem;
}

.lp-title-light {
  color: #ffffff;
}

.lp-highlight-green {
  color: #7cb342;
  font-style: italic;
}

.lp-highlight-blue {
  color: #2196f3;
  font-style: italic;
}

.lp-highlight-purple {
  color: #ab47bc;
  font-style: italic;
}

.lp-step-desc {
  font-size: 1.125rem;
  color: #666;
  line-height: 1.8;
}

.lp-desc-light {
  color: rgba(255,255,255,0.7);
}

.lp-screenshot {
  width: 100%;
  border-radius: 16px;
  box-shadow: 0 20px 60px rgba(0,0,0,0.15);
}

.lp-feature-cards {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.lp-mini-card {
  background: #f8f9fa;
  padding: 1.5rem;
  border-radius: 12px;
  display: flex;
  align-items: center;
  gap: 1rem;
  font-weight: 500;
  color: #333;
  border: 1px solid #eee;
  transition: transform 0.2s, box-shadow 0.2s;
}

.lp-mini-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0,0,0,0.1);
}

.lp-mini-icon {
  font-size: 1.5rem;
}

.lp-cta-button {
  display: inline-block;
  margin-top: 2rem;
  padding: 1rem 2.5rem;
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white !important;
  font-weight: 600;
  font-size: 1.125rem;
  border-radius: 50px;
  text-decoration: none;
  transition: transform 0.2s, box-shadow 0.2s;
}

.lp-cta-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 32px rgba(102, 126, 234, 0.4);
}

.lp-stats {
  display: flex;
  gap: 3rem;
  justify-content: center;
}

.lp-stat {
  text-align: center;
}

.lp-stat-value {
  font-size: 3rem;
  font-weight: 800;
  color: #ffffff;
  margin-bottom: 0.5rem;
}

.lp-stat-label {
  font-size: 0.875rem;
  color: rgba(255,255,255,0.6);
  text-transform: uppercase;
  letter-spacing: 0.1em;
}

@media (max-width: 768px) {
  .lp-section {
    padding: 3rem 1.5rem;
    min-height: auto;
  }
  
  .lp-section-title {
    font-size: 2.5rem;
  }
  
  .lp-step {
    grid-template-columns: 1fr;
    gap: 2rem;
  }
  
  .lp-step-reverse {
    direction: ltr;
  }
  
  .lp-step-title {
    font-size: 2rem;
  }
  
  .lp-feature-cards {
    grid-template-columns: 1fr;
  }
  
  .lp-stats {
    flex-direction: column;
    gap: 2rem;
  }
}
`

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

  // 랜딩 페이지 모드 감지
  const isLandingPage = app?.detail_html?.includes('landing-page')

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
