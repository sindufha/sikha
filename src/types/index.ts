export type Role = 'ADMIN' | 'GURU'

export type StatusPresensi = 'HADIR' | 'IZIN' | 'SAKIT' | 'ALFA' | 'TERLAMBAT'

export interface User {
  id: string
  username: string
  role: Role
  nama: string
  kelas?: Kelas[]
  createdAt: Date
  updatedAt: Date
}

export interface Kelas {
  id: string
  nama: string
  waliKelasId: string | null
  waliKelas?: User | null
  siswa?: Siswa[]
  createdAt: Date
  updatedAt: Date
}

export interface Siswa {
  id: string
  nis: string
  nama: string
  kelasId: string
  kelas?: Kelas
  qrCode: string
  presensi?: Presensi[]
  createdAt: Date
  updatedAt: Date
}

export interface JamPresensi {
  id: string
  jamMasuk: string
  toleransiMenit: number
  jamPulang: string | null
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export interface Presensi {
  id: string
  siswaId: string
  siswa?: Siswa
  tanggal: Date
  status: StatusPresensi
  jamDatang: Date | null
  keterangan: string | null
  createdAt: Date
  updatedAt: Date
}

export interface AuthUser {
  id: string
  username: string
  role: Role
  nama: string
  kelasId?: string
}

export interface LoginCredentials {
  username: string
  password: string
}

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface PresensiStats {
  totalSiswa: number
  hadir: number
  izin: number
  sakit: number
  alfa: number
  terlambat: number
}

export interface DashboardStats extends PresensiStats {
  totalKelas: number
  totalGuru: number
}

export const STATUS_LABELS: Record<StatusPresensi, string> = {
  HADIR: 'Hadir',
  IZIN: 'Izin',
  SAKIT: 'Sakit',
  ALFA: 'Alfa',
  TERLAMBAT: 'Terlambat',
}

export const STATUS_COLORS: Record<StatusPresensi, string> = {
  HADIR: 'bg-green-100 text-green-800',
  IZIN: 'bg-blue-100 text-blue-800',
  SAKIT: 'bg-yellow-100 text-yellow-800',
  ALFA: 'bg-red-100 text-red-800',
  TERLAMBAT: 'bg-orange-100 text-orange-800',
}

export const ROLE_LABELS: Record<Role, string> = {
  ADMIN: 'Admin',
  GURU: 'Guru',
}