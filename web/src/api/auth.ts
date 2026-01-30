import apiClient from './client'

export interface LoginRequest {
  username: string
  password: string
}

export interface LoginResponse {
  access_token: string
  token_type: string
}

export interface User {
  id: number
  email: string
  is_active: boolean
  is_admin: boolean
  created_at: string
}

export const login = async (data: LoginRequest): Promise<LoginResponse> => {
  const formData = new URLSearchParams()
  formData.append('username', data.username)
  formData.append('password', data.password)
  
  const response = await apiClient.post('/auth/login', formData, {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  })
  return response.data
}

export const getMe = async (): Promise<User> => {
  const response = await apiClient.get('/auth/me')
  return response.data
}
