import type { LearningState } from '../types'

export interface AuthUser {
  id: string
  username: string
}

export interface CloudProgress {
  state: LearningState | null
  version: number
  updatedAt: string | null
}

export class ApiError extends Error {
  status: number
  payload?: Record<string, unknown>

  constructor(message: string, status: number, payload?: Record<string, unknown>) {
    super(message)
    this.status = status
    this.payload = payload
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    ...init,
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json', ...init?.headers },
  })
  const payload = response.status === 204 ? null : await response.json().catch(() => null)
  if (!response.ok) {
    const message = payload && typeof payload.error === 'string' ? payload.error : 'Không thể kết nối máy chủ.'
    throw new ApiError(message, response.status, payload ?? undefined)
  }
  return payload as T
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  try {
    const result = await request<{ user: AuthUser }>('/api/auth/me')
    return result.user
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) return null
    throw error
  }
}

export async function registerAccount(username: string, password: string): Promise<AuthUser> {
  const result = await request<{ user: AuthUser }>('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  })
  return result.user
}

export async function loginAccount(username: string, password: string): Promise<AuthUser> {
  const result = await request<{ user: AuthUser }>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  })
  return result.user
}

export async function logoutAccount(): Promise<void> {
  await request<null>('/api/auth/logout', { method: 'POST', body: '{}' })
}

export function getCloudProgress(): Promise<CloudProgress> {
  return request<CloudProgress>('/api/progress')
}

export function saveCloudProgress(state: LearningState, baseVersion: number): Promise<{ version: number; updatedAt: string }> {
  return request('/api/progress', {
    method: 'PUT',
    body: JSON.stringify({ state, baseVersion }),
  })
}
