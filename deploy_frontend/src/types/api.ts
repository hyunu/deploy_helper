export enum ReleaseChannel {
  STABLE = "stable",
  BETA = "beta",
  ALPHA = "alpha",
}

// Auth Schemas
export interface Token {
  access_token: string;
  token_type: string;
}

export interface UserBase {
  email: string;
}

export interface UserCreate extends UserBase {
  password: string;
  is_admin?: boolean; // 추가
}

export interface UserResponse extends UserBase {
  id: number;
  is_active: boolean;
  is_admin: boolean;
  created_at: string;
}

export interface UserUpdate {
  email?: string;
  password?: string;
  is_active?: boolean;
  is_admin?: boolean;
}

// App Schemas
export interface AppBase {
  app_id: string;
  name: string;
  description?: string;
  group?: string;
}

export interface AppCreate extends AppBase {}

export interface AppUpdate extends AppBase {
  detail_html?: string;
  custom_css?: string;
  icon_url?: string;
  is_public?: boolean;
  group?: string;
}

export interface AppResponse extends AppBase {
  id: number;
  detail_html?: string;
  custom_css?: string;
  icon_url?: string;
  is_public: boolean;
  manual_file_path?: string;
  manual_file_name?: string;
  group?: string;
  created_at: string;
  updated_at?: string;
}

export interface AppPublicResponse {
  app_id: string;
  name: string;
  description?: string;
  group?: string;
  detail_html?: string;
  custom_css?: string;
  icon_url?: string;
  latest_version?: string;
  download_url?: string;
  file_size?: number;
  manual_download_url?: string;
  manual_file_name?: string;
}

export interface AppListResponse {
  apps: AppResponse[];
  total: number;
}

// Version Schemas
export interface VersionBase {
  version: string;
  channel: ReleaseChannel;
  release_notes?: string;
  is_mandatory: boolean;
}

export interface VersionCreate extends VersionBase {}

export interface VersionResponse extends VersionBase {
  id: number;
  app_id: number;
  file_name: string;
  file_size: number;
  file_hash: string;
  is_active: boolean;
  download_count: number;
  created_at: string;
  published_at?: string;
}

export interface VersionListResponse {
  versions: VersionResponse[];
  total: number;
}

// Update Check Schemas
export interface UpdateCheckRequest {
  app_id: string;
  current_version: string;
  channel?: ReleaseChannel;
}

export interface UpdateCheckResponse {
  update_available: boolean;
  current_version: string;
  latest_version?: string;
  is_mandatory?: boolean;
  release_notes?: string;
  download_url?: string;
  file_size?: number;
  file_hash?: string;
}

// Statistics Schemas
export interface AppStats {
  app_id: string;
  app_name: string;
  total_versions: number;
  total_downloads: number;
  latest_version?: string;
}

export interface DashboardStats {
  total_apps: number;
  total_versions: number;
  total_downloads: number;
  apps: AppStats[];
}
