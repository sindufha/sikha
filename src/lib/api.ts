const API_BASE = '/api'

// ── In-memory cache untuk GET requests ──
const responseCache = new Map<string, { data: any; expiresAt: number }>()
const CACHE_TTL = 45_000 // 45 detik — cukup untuk navigasi antar halaman

function cacheKey(endpoint: string, method: string): string {
  return `${method}:${endpoint}`
}

function cacheGet<T>(key: string): T | null {
  const entry = responseCache.get(key)
  if (!entry) return null
  if (entry.expiresAt < Date.now()) {
    responseCache.delete(key)
    return null
  }
  return entry.data as T
}

function cacheSet(key: string, data: any): void {
  responseCache.set(key, { data, expiresAt: Date.now() + CACHE_TTL })
}

function cacheClear(resource?: string): void {
  if (!resource) { responseCache.clear(); return }
  for (const key of responseCache.keys()) {
    if (key.includes(`:${resource}`) || key.includes(`/${resource}`)) {
      responseCache.delete(key)
    }
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const method = options.method || 'GET'
  const token = localStorage.getItem('sikha_token')
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  // GET request: coba ambil dari cache dulu
  if (method === 'GET') {
    const key = cacheKey(endpoint, method)
    const cached = cacheGet<T>(key)
    if (cached) return cached
  }

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  })

  const data = await res.json()

  if (!res.ok || !data.success) {
    if (res.status === 401) {
      localStorage.removeItem('sikha_token')
      responseCache.clear()
      window.location.href = '/login'
    }
    throw new Error(data.error || 'Terjadi kesalahan')
  }

  // Cache response GET
  if (method === 'GET') {
    const key = cacheKey(endpoint, method)
    cacheSet(key, data.data)
  }

  // Mutation (POST/PUT/DELETE): invalidate cache resource terkait + dashboard
  if (['POST', 'PUT', 'DELETE'].includes(method)) {
    const resource = endpoint.split('/').filter(Boolean)[0]
    cacheClear(resource)
    cacheClear('dashboard') // dashboard pake data agregat
  }

  return data.data
}

export const api = {
  auth: {
    login: (username: string, password: string) =>
      request<{ token: string; user: any }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username, password }),
      }),
    me: () => request<any>('/auth/me'),
  },

  admin: {
    dashboard: () => request<{ stats: any; daftarKelas: any[] }>('/admin/dashboard'),
    auditLogs: (params?: { page?: number; limit?: number; aksi?: string; userId?: string; tanggalMulai?: string; tanggalSelesai?: string }) => {
      const query = new URLSearchParams()
      if (params?.page) query.set('page', String(params.page))
      if (params?.limit) query.set('limit', String(params.limit))
      if (params?.aksi) query.set('aksi', params.aksi)
      if (params?.userId) query.set('userId', params.userId)
      if (params?.tanggalMulai) query.set('tanggalMulai', params.tanggalMulai)
      if (params?.tanggalSelesai) query.set('tanggalSelesai', params.tanggalSelesai)
      return request<{ logs: any[]; pagination: { page: number; limit: number; total: number; totalPages: number } }>(`/admin/audit-logs?${query.toString()}`)
    },
  },

  guru: {
    dashboard: () => request<{ kelas: any[]; siswa: any[]; stats: any }>('/guru/dashboard'),
  },

  siswa: {
    list: (params?: { kelas?: string; search?: string }) => {
      const query = new URLSearchParams()
      if (params?.kelas) query.set('kelas', params.kelas)
      if (params?.search) query.set('search', params.search)
      return request<any[]>(`/siswa?${query.toString()}`)
    },
    create: (data: any) =>
      request<any>('/siswa', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: any) =>
      request<any>(`/siswa/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) =>
      request<any>(`/siswa/${id}`, { method: 'DELETE' }),
  },

  kelas: {
    list: () => request<any[]>('/kelas'),
    create: (data: { nama: string; waliKelasId?: string }) =>
      request<any>('/kelas', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: { nama: string; waliKelasId?: string }) =>
      request<any>(`/kelas/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) =>
      request<any>(`/kelas/${id}`, { method: 'DELETE' }),
  },

  users: {
    list: () => request<any[]>('/users'),
    create: (data: { username: string; password: string; role: string; nama: string }) =>
      request<any>('/users', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: any) =>
      request<any>(`/users/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) =>
      request<any>(`/users/${id}`, { method: 'DELETE' }),
  },

  presensi: {
    manual: (presensiList: { siswaId: string; status: string; keterangan?: string }[]) =>
      request<any>('/presensi/manual', { method: 'POST', body: JSON.stringify({ presensiList }) }),
    qr: (qrData: any) =>
      request<any>('/presensi/qr', { method: 'POST', body: JSON.stringify({ qrData }) }),
    hariIni: () => request<any[]>('/presensi/hari-ini'),
    recentQr: () => request<any[]>('/presensi/recent-qr'),
  },

  qr: {
    perKelas: (kelasId: string) => request<{ kelas: string; siswa: any[] }>(`/qr/kelas/${kelasId}`),
    semua: () => request<{ total: number; siswa: any[] }>('/qr/semua'),
  },

  laporan: {
    list: (params?: { kelasId?: string; tanggalMulai?: string; tanggalSelesai?: string; status?: string }) => {
      const query = new URLSearchParams()
      if (params?.kelasId) query.set('kelasId', params.kelasId)
      if (params?.tanggalMulai) query.set('tanggalMulai', params.tanggalMulai)
      if (params?.tanggalSelesai) query.set('tanggalSelesai', params.tanggalSelesai)
      if (params?.status) query.set('status', params.status)
      return request<any[]>(`/laporan?${query.toString()}`)
    },
  },

  jamPresensi: {
    get: () => request<any>('/pengaturan/jam'),
    update: (data: { jamMasuk: string; toleransiMenit: number; jamPulang?: string }) =>
      request<any>('/pengaturan/jam', { method: 'PUT', body: JSON.stringify(data) }),
  },

  profil: {
    gantiPassword: (data: { passwordLama: string; passwordBaru: string }) =>
      request<any>('/profil/password', { method: 'PUT', body: JSON.stringify(data) }),
  },
}