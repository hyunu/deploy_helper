import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { getPublicAppsList } from '../api/apps'
import { Package, ExternalLink } from 'lucide-react'

export default function PublicAppsPage() {
  const { data: appsData, isLoading } = useQuery({
    queryKey: ['publicApps'],
    queryFn: getPublicAppsList,
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">배포 프로그램 목록</h1>

        {appsData?.apps.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center shadow-sm">
            <Package className="w-16 h-16 text-gray-300 mx-auto" />
            <p className="mt-4 text-xl text-gray-500">등록된 공개 앱이 없습니다</p>
            <p className="mt-2 text-gray-400">관리자에게 문의하거나 잠시 후 다시 시도해주세요.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {appsData?.apps.map((app) => (
              <Link
                key={app.app_id}
                to={`/p/${app.app_id}`}
                className="block bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-lg transition-shadow duration-200"
              >
                <div className="flex items-center mb-4">
                  {app.icon_url ? (
                    <img src={app.icon_url} alt={`${app.name} 아이콘`} className="w-12 h-12 rounded-lg mr-4" />
                  ) : (
                    <div className="w-12 h-12 rounded-lg mr-4 bg-blue-100 flex items-center justify-center text-blue-600">
                      <Package className="w-6 h-6" />
                    </div>
                  )}
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 break-words">
                      {app.name}
                    </h2>
                    <p className="text-sm text-gray-500 font-mono">{app.app_id}</p>
                  </div>
                </div>
                {app.description && (
                  <p className="text-gray-600 line-clamp-3 text-sm">
                    {app.description}
                  </p>
                )}
                <div className="mt-4 text-blue-600 hover:text-blue-700 flex items-center text-sm font-medium">
                  자세히 보기 <ExternalLink className="w-4 h-4 ml-1" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
