import apiClient from './client'

export interface App {
  id: number
  app_id: string
  name: string
  description: string | null
  detail_html: string | null
  custom_css: string | null
  icon_url: string | null
  is_public: boolean
  created_at: string
  updated_at: string | null
}

export interface AppListResponse {
  apps: App[]
  total: number
}

export interface CreateAppRequest {
  app_id: string
  name: string
  description?: string
}

export interface UpdateAppRequest {
  app_id: string
  name: string
  description?: string
  detail_html?: string
  custom_css?: string
  icon_url?: string
  is_public?: boolean
}

export interface PublicApp {
  app_id: string
  name: string
  description: string | null
  detail_html: string | null
  custom_css: string | null
  icon_url: string | null
  latest_version: string | null
  download_url: string | null
  file_size: number | null
}

export interface Version {
  id: number
  app_id: number
  version: string
  channel: 'stable' | 'beta' | 'alpha'
  release_notes: string | null
  file_name: string
  file_size: number
  file_hash: string
  is_active: boolean
  is_mandatory: boolean
  download_count: number
  created_at: string
  published_at: string | null
}

export interface VersionListResponse {
  versions: Version[]
  total: number
}

export interface UpdateVersionRequest {
  version?: string
  channel?: 'stable' | 'beta' | 'alpha'
  release_notes?: string
  is_mandatory?: boolean
}

export interface DashboardStats {
  total_apps: number
  total_versions: number
  total_downloads: number
  apps: {
    app_id: string
    app_name: string
    total_versions: number
    total_downloads: number
    latest_version: string | null
  }[]
}

// Apps API
export const getApps = async (): Promise<AppListResponse> => {
  const response = await apiClient.get('/apps')
  return response.data
}

export const getApp = async (appId: string): Promise<App> => {
  const response = await apiClient.get(`/apps/${appId}`)
  return response.data
}

export const createApp = async (data: CreateAppRequest): Promise<App> => {
  const response = await apiClient.post('/apps', data)
  return response.data
}

export const updateApp = async (appId: string, data: UpdateAppRequest): Promise<App> => {
  const response = await apiClient.put(`/apps/${appId}`, data)
  return response.data
}

export const deleteApp = async (appId: string): Promise<void> => {
  await apiClient.delete(`/apps/${appId}`)
}

export const getPublicApp = async (appId: string): Promise<PublicApp> => {
  const response = await apiClient.get(`/apps/public/${appId}`)
  return response.data
}

export const getPublicAppsList = async (): Promise<AppListResponse> => {
  const response = await apiClient.get('/apps/public')
  return response.data
}

// Versions API
export const getVersions = async (appId: string): Promise<VersionListResponse> => {
  const response = await apiClient.get(`/apps/${appId}/versions`)
  return response.data
}

export const uploadVersion = async (
  appId: string,
  data: FormData
): Promise<Version> => {
  const response = await apiClient.post(`/apps/${appId}/versions`, data, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })
  return response.data
}

export const activateVersion = async (appId: string, versionId: number): Promise<void> => {
  await apiClient.patch(`/apps/${appId}/versions/${versionId}/activate`)
}

export const updateVersion = async (
  appId: string,
  versionId: number,
  data: UpdateVersionRequest
): Promise<Version> => {
  const response = await apiClient.patch(`/apps/${appId}/versions/${versionId}`, data)
  return response.data
}

export const deactivateVersion = async (appId: string, versionId: number): Promise<void> => {
  await apiClient.patch(`/apps/${appId}/versions/${versionId}/deactivate`)
}

export const deleteVersion = async (appId: string, versionId: number): Promise<void> => {
  await apiClient.delete(`/apps/${appId}/versions/${versionId}`)
}

// Stats API
export const getDashboardStats = async (): Promise<DashboardStats> => {
  const response = await apiClient.get('/stats/dashboard')
  return response.data
}
