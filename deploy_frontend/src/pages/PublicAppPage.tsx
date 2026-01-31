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
  const contentRef = useRef<HTMLDivElement>(null)
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

  // Tailwind CDN 동적 로드
  useEffect(() => {
    if (isLandingPage && !tailwindLoaded) {
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
  }, [isLandingPage, tailwindLoaded])

  // 랜딩 페이지 모드에서 이미지 제거
  useEffect(() => {
    if (landingPageRef.current && app?.detail_html && isLandingPage) {
      const removeImages = () => {
        const el = landingPageRef.current
        if (!el) return

        // 모든 이미지 제거
        const images = el.querySelectorAll('img')
        images.forEach((img) => {
          const src = img.getAttribute('src') || ''
          const alt = img.getAttribute('alt') || ''
          if (src.includes('placeholder') || 
              src.includes('icon') || 
              alt.includes('App') || 
              alt.includes('앱')) {
            img.remove()
          }
        })
        
        // 그라데이션 배경을 가진 첫 번째 div 제거
        const firstChild = el.firstElementChild
        if (firstChild) {
          const style = window.getComputedStyle(firstChild)
          const classes = firstChild.className || ''
          const bgImage = style.backgroundImage
          
          if ((bgImage && bgImage !== 'none' && bgImage.includes('gradient')) ||
              classes.includes('gradient') ||
              classes.includes('from-blue') ||
              classes.includes('to-purple')) {
            firstChild.remove()
          }
        }
      }

      removeImages()
      setTimeout(removeImages, 100)
      setTimeout(removeImages, 500)
    }
  }, [app?.detail_html, isLandingPage])

  // 상단 고정 요소 및 이미지 제거
  useEffect(() => {
    if (contentRef.current && app?.detail_html) {
      const removeFixedElements = () => {
        const el = contentRef.current
        if (!el) return

        // 상단 고정 요소 제거
        const fixedElements = el.querySelectorAll('[style*="fixed"], [style*="sticky"], [class*="fixed"], [class*="sticky"]')
        fixedElements.forEach((elem) => {
          const style = window.getComputedStyle(elem)
          if (style.position === 'fixed' || style.position === 'sticky') {
            elem.remove()
          }
        })
        
        // 첫 번째와 두 번째 자식 요소가 고정 요소인 경우 제거
        const firstChild = el.firstElementChild
        const secondChild = firstChild?.nextElementSibling
        if (firstChild) {
          const firstStyle = window.getComputedStyle(firstChild)
          if (firstStyle.position === 'fixed' || firstStyle.position === 'sticky') {
            firstChild.remove()
          }
        }
        if (secondChild) {
          const secondStyle = window.getComputedStyle(secondChild)
          if (secondStyle.position === 'fixed' || secondStyle.position === 'sticky') {
            secondChild.remove()
          }
        }
        
        // 모든 이미지 제거 (특히 placeholder, icon 관련)
        const images = el.querySelectorAll('img')
        images.forEach((img) => {
          const src = img.getAttribute('src') || ''
          const alt = img.getAttribute('alt') || ''
          // placeholder, icon, 또는 App 관련 이미지 모두 제거
          if (src.includes('placeholder') || 
              src.includes('icon') || 
              alt.includes('App') || 
              alt.includes('앱') ||
              img.classList.contains('app-icon') ||
              img.closest('.app-header')) {
            img.remove()
          }
        })
        
        // 그라데이션 배경을 가진 첫 번째 div 제거
        const allDivs = el.querySelectorAll('div')
        allDivs.forEach((div, index) => {
          if (index < 3) { // 첫 3개 div 확인
            const style = window.getComputedStyle(div)
            const bgImage = style.backgroundImage
            const classes = div.className || ''
            
            // 그라데이션 배경이 있거나 gradient 클래스를 가진 경우 제거
            if ((bgImage && bgImage !== 'none' && (bgImage.includes('gradient') || bgImage.includes('linear-gradient'))) ||
                classes.includes('gradient') ||
                classes.includes('from-blue') ||
                classes.includes('to-purple')) {
              div.remove()
              return // 제거했으므로 다음으로
            }
          }
        })
        
        // 첫 번째 자식이 이미지나 그라데이션 div인 경우 제거 (이미 위에서 firstChild를 사용했으므로 다시 확인)
        const firstChildElement = el.firstElementChild
        if (firstChildElement) {
          const firstChildStyle = window.getComputedStyle(firstChildElement)
          const firstChildClasses = firstChildElement.className || ''
          const firstChildBgImage = firstChildStyle.backgroundImage
          
          if (firstChildElement.tagName === 'IMG' ||
              (firstChildBgImage && firstChildBgImage !== 'none' && firstChildBgImage.includes('gradient')) ||
              firstChildClasses.includes('gradient') ||
              firstChildClasses.includes('from-blue') ||
              firstChildClasses.includes('to-purple')) {
            firstChildElement.remove()
          }
        }
      }

      // 즉시 실행 및 약간의 지연 후 재실행 (동적 콘텐츠 대응)
      removeFixedElements()
      setTimeout(removeFixedElements, 100)
      setTimeout(removeFixedElements, 500)
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

  // 랜딩 페이지 모드
  if (isLandingPage) {
    return (
      <>
        <style>{landingPageCss}</style>
        {app.custom_css && <style>{app.custom_css}</style>}
        {/* 랜딩 페이지 이미지 제거 CSS */}
        <style>{`
          /* 랜딩 페이지 내부의 이미지 제거 */
          img[src*="placeholder"],
          img[src*="icon"],
          img[alt*="App"],
          img[alt*="앱"] {
            display: none !important;
          }
          
          /* 그라데이션 배경을 가진 첫 번째 div 제거 */
          div[class*="gradient"]:first-child,
          div[style*="gradient"]:first-child {
            display: none !important;
          }
        `}</style>
        <div className="min-h-screen bg-white">
          <div
            ref={landingPageRef}
            dangerouslySetInnerHTML={{ __html: app.detail_html || '' }}
          />
          <footer className="py-6 text-center text-sm text-gray-400 bg-gray-100">
            Powered by Deploy Helper
          </footer>
        </div>
      </>
    )
  }

  // 기본 레이아웃
  return (
    <>
      {/* 상단 고정 요소 및 이미지 제거 CSS (custom_css보다 먼저 적용) */}
      <style>{`
        /* 상단 고정 헤더/배너 제거 */
        header[style*="fixed"],
        header[style*="sticky"],
        .fixed-top,
        .sticky-top,
        [style*="position: fixed"],
        [style*="position:fixed"],
        [style*="position: sticky"],
        [style*="position:sticky"],
        [class*="fixed"],
        [class*="sticky"] {
          display: none !important;
        }
        
        /* 상단에 위치한 고정 요소 제거 */
        body > header:first-child,
        body > div:first-child > header,
        body > div:first-child > div[style*="fixed"],
        body > div:first-child > div[style*="sticky"],
        body > div:first-child[style*="fixed"],
        body > div:first-child[style*="sticky"],
        /* 그라데이션 배경을 가진 상단 요소 */
        div[style*="gradient"][style*="fixed"],
        div[style*="gradient"][style*="sticky"],
        /* 어두운 회색 상단 바 */
        div[style*="background"][style*="fixed"]:first-child,
        div[style*="background"][style*="sticky"]:first-child {
          display: none !important;
        }
        
        /* 앱 아이콘 이미지 제거 */
        .app-icon,
        img.app-icon,
        .app-header img,
        .app-header > img {
          display: none !important;
        }
        
        /* detail_html 내부의 모든 이미지 제거 */
        .app-content img,
        .app-content > img,
        .app-content div img,
        .app-content > div > img,
        .app-content img[src*="placeholder"],
        .app-content img[src*="icon"],
        .app-content img[alt*="App"],
        .app-content img[alt*="앱"] {
          display: none !important;
        }
        
        /* 그라데이션 배경을 가진 첫 번째 div 제거 */
        .app-content > div:first-child[class*="gradient"],
        .app-content > div:first-child[style*="gradient"],
        .app-content div:first-child[class*="gradient"],
        .app-content div:first-child[style*="gradient"] {
          display: none !important;
        }
      `}</style>
      
      {/* 커스텀 CSS 적용 (이미지 제거 CSS 이후에 적용하여 우선순위 확보) */}
      {app.custom_css && <style>{app.custom_css}</style>}

      <div className="min-h-screen bg-gray-50">
        <div className="app-detail-container">
          {/* 헤더 영역 */}
          <div className="app-header">
            <h1 className="app-title">{app.name}</h1>
            {app.description && <p className="app-description">{app.description}</p>}

            {/* 버전 및 다운로드 */}
            <div className="mt-6">
              {app.latest_version ? (
                <div className="space-y-3">
                  <p className="text-sm text-gray-500">
                    최신 버전: <span className="font-semibold">v{app.latest_version}</span>
                    {app.file_size && (
                      <span className="ml-2">({formatBytes(app.file_size)})</span>
                    )}
                  </p>
                  <button onClick={handleDownload} className="download-button">
                    <Download className="w-5 h-5" />
                    다운로드
                  </button>
                </div>
              ) : (
                <p className="text-sm text-gray-500">아직 배포된 버전이 없습니다.</p>
              )}
            </div>
          </div>

          {/* 상세 콘텐츠 */}
          {app.detail_html && (
            <div
              ref={contentRef}
              className="app-content"
              dangerouslySetInnerHTML={{ __html: app.detail_html }}
            />
          )}
        </div>

        {/* 푸터 */}
        <footer className="mt-12 py-8 border-t border-gray-200">
          <div className="max-w-4xl mx-auto px-4 text-center text-sm text-gray-400">
            Powered by Deploy Helper
          </div>
        </footer>
      </div>
    </>
  )
}
