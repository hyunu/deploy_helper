import { UserCreate, UserResponse, UserUpdate } from '../types/api';
import api from './client';

export const createUser = async (user: UserCreate) => {
  const response = await api.post<UserResponse>('/users/', user);
  return response.data;
};

export const getUsers = async () => {
  const response = await api.get<UserResponse[]>('/users/');
  return response.data;
};

export const getUser = async (userId: number) => {
  const response = await api.get<UserResponse>(`/users/${userId}`);
  return response.data;
};

export const updateUser = async (userId: number, user: UserUpdate) => {
  const response = await api.put<UserResponse>(`/users/${userId}`, user);
  return response.data;
};

export const deleteUser = async (userId: number) => {
  const response = await api.delete(`/users/${userId}`);
  return response.data;
};
