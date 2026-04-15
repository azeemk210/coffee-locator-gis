'use client'

import axios from 'axios'
import { config } from './config'

// Use configuration from config.ts (reads NEXT_PUBLIC_API_URL)
const API_BASE = config.apiUrl

console.log('[API] Using base URL:', API_BASE)

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Add token to requests
api.interceptors.request.use((config) => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export interface Shop {
  id: number
  name: string
  creator_id: number
  location: {
    type: 'Point'
    coordinates: [number, number]
  }
}

export const authAPI = {
  loginJson: (email: string, password: string) =>
    api.post<{ access_token: string; token_type: string }>('/auth/login-json', {
      email,
      password,
    }),

  register: (email: string, password: string) =>
    api.post<{ id: number; email: string; role: string }>('/auth/register', {
      email,
      password,
    }),
}

export const shopsAPI = {
  list: () => api.get<Shop[]>('/shops'),

  create: (name: string, coordinates: [number, number]) =>
    api.post<Shop>('/shops', {
      name,
      location: {
        type: 'Point',
        coordinates,
      },
    }),
}

export default api
