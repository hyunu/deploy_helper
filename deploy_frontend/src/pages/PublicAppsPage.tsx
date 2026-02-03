import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { getPublicAppsList } from '../api/apps'
import { Package, ExternalLink, Download, Sparkles, Folder } from 'lucide-react'

export default function PublicAppsPage() {
  const { data: appsData, isLoading, error } = useQuery({
    queryKey: ['publicApps'],
    queryFn: getPublicAppsList,
    staleTime: 0, // 캐시 무효화
    gcTime: 0, // 캐시 시간 0으로 설정 (React Query v5)
  })

  // 그룹별로 앱을 분류 (중복 제거)
  const groupedApps = useMemo(() => {
    if (!appsData?.apps || !Array.isArray(appsData.apps)) return null

    // app_id 기준으로 중복 제거 (더 강력한 중복 제거)
    const seen = new Set<string>()
    const uniqueApps: typeof appsData.apps = []
    
    appsData.apps.forEach((app) => {
      if (app && app.app_id && !seen.has(app.app_id)) {
        seen.add(app.app_id)
        uniqueApps.push(app)
      }
    })

    const groups: Record<string, typeof appsData.apps> = {}
    const ungrouped: typeof appsData.apps = []

    uniqueApps.forEach((app) => {
      if (app.group && app.group.trim()) {
        const groupName = app.group.trim()
        if (!groups[groupName]) {
          groups[groupName] = []
        }
        groups[groupName].push(app)
      } else {
        ungrouped.push(app)
      }
    })

    return { groups, ungrouped }
  }, [appsData])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">앱 목록을 불러오는 중...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <Package className="w-16 h-16 text-gray-300 mx-auto" />
          <p className="mt-4 text-xl text-gray-500">앱 목록을 불러오는 중 오류가 발생했습니다</p>
          <p className="mt-2 text-gray-400">잠시 후 다시 시도해주세요.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* 헤더 */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center gap-3">
            <Sparkles className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">다운로드 센터</h1>
          </div>
        </div>
      </div>

      {/* 메인 콘텐츠 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24">
        {!appsData || !appsData.apps || appsData.apps.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center shadow-sm">
            <Package className="w-16 h-16 text-gray-300 mx-auto" />
            <p className="mt-4 text-xl text-gray-500">배포 가능한 앱이 없습니다</p>
            <p className="mt-2 text-gray-400">관리자에게 문의하거나 잠시 후 다시 시도해주세요.</p>
          </div>
        ) : (
          <>
            <div className="mb-6 text-sm text-gray-600">
              총 <span className="font-semibold text-gray-900">{appsData.total || 0}</span>개의 앱이 배포 중입니다
            </div>

            {/* 그룹별로 표시 */}
            {groupedApps && Object.keys(groupedApps.groups).length > 0 && (
              <div className="space-y-8 mb-8">
                {Object.entries(groupedApps.groups).map(([groupName, apps]) => (
                  <div key={groupName} className="space-y-4">
                    <div className="flex items-center gap-2 pb-2 border-b border-gray-200">
                      <Folder className="w-5 h-5 text-blue-600" />
                      <h2 className="text-xl font-bold text-gray-900">{groupName}</h2>
                      <span className="text-sm text-gray-500">({apps.length}개)</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {apps.map((app) => (
                        <AppCard key={app.app_id} app={app} />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* 그룹이 없는 앱들 */}
            {groupedApps && groupedApps.ungrouped.length > 0 && (
              <div className="space-y-4">
                {/* 그룹이 있을 때만 "기타" 헤더 표시 */}
                {Object.keys(groupedApps.groups).length > 0 && (
                  <div className="flex items-center gap-2 pb-2 border-b border-gray-200">
                    <Package className="w-5 h-5 text-gray-600" />
                    <h2 className="text-xl font-bold text-gray-900">기타</h2>
                    <span className="text-sm text-gray-500">({groupedApps.ungrouped.length}개)</span>
                  </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {groupedApps.ungrouped.map((app) => (
                    <AppCard key={app.app_id} app={app} />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* 푸터 - 화면 하단 고정 */}
      <footer className="fixed bottom-0 left-0 right-0 py-4 border-t border-gray-200 bg-white z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-sm text-gray-500">
          <p>Powered by Deploy Helper</p>
        </div>
      </footer>
    </div>
  )
}

// 앱 카드 컴포넌트
function AppCard({ app }: { app: { app_id: string; name: string; description: string | null; icon_url: string | null } }) {
  return (
    <Link
      to={`/p/${app.app_id}`}
      className="group block bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-xl hover:border-blue-300 transition-all duration-200 hover:-translate-y-1"
    >
      {/* 아이콘 및 제목 영역 */}
      <div className="flex items-start mb-4">
        <div className="relative w-16 h-16 rounded-xl mr-4 flex-shrink-0 shadow-sm overflow-hidden">
          {app.icon_url ? (
            <img 
              src={app.icon_url} 
              alt={`${app.name} 아이콘`} 
              className="w-full h-full object-cover"
              onError={(e) => {
                const target = e.target as HTMLImageElement
                target.style.display = 'none'
                const fallback = target.parentElement?.querySelector('.icon-fallback') as HTMLElement
                if (fallback) fallback.style.display = 'flex'
              }}
            />
          ) : null}
          <div className={`icon-fallback w-full h-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center text-blue-600 ${app.icon_url ? 'hidden' : 'flex'}`}>
            <Package className="w-8 h-8" />
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-xl font-bold text-gray-900 break-words group-hover:text-blue-600 transition-colors">
            {app.name}
          </h2>
          <p className="text-xs text-gray-500 font-mono mt-1 truncate">{app.app_id}</p>
        </div>
      </div>

      {/* 설명 */}
      {app.description && (
        <p className="text-gray-600 line-clamp-3 text-sm mb-4 min-h-[3.5rem]">
          {app.description}
        </p>
      )}

      {/* 하단 액션 영역 */}
      <div className="mt-auto pt-4 border-t border-gray-100 flex items-center justify-between">
        <span className="text-blue-600 group-hover:text-blue-700 flex items-center text-sm font-medium">
          다운로드 페이지
          <ExternalLink className="w-4 h-4 ml-1 group-hover:translate-x-0.5 transition-transform" />
        </span>
        <Download className="w-5 h-5 text-gray-400 group-hover:text-blue-600 transition-colors" />
      </div>
    </Link>
  )
}
