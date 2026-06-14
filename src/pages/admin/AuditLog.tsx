import { useState, useEffect } from 'react'
import { api } from '@/lib/api'
import { useToast } from '@/contexts/ToastContext'
import { TableSkeleton } from '@/components/ui/Skeleton'
import EmptyState from '@/components/ui/EmptyState'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import {
  Activity, AlertTriangle, CheckCircle, Search,
  ChevronLeft, ChevronRight, Shield, Filter,
} from 'lucide-react'

type AksiAudit =
  | 'LOGIN' | 'LOGOUT'
  | 'CREATE_USER' | 'UPDATE_USER' | 'DELETE_USER'
  | 'CREATE_SISWA' | 'UPDATE_SISWA' | 'DELETE_SISWA'
  | 'CREATE_KELAS' | 'UPDATE_KELAS' | 'DELETE_KELAS'
  | 'CREATE_PRESENSI' | 'UPDATE_PRESENSI' | 'DELETE_PRESENSI'
  | 'UPDATE_JAM_PRESENSI' | 'RESET_PASSWORD'

const AKSI_AUDIT_VALUES: AksiAudit[] = [
  'LOGIN', 'LOGOUT',
  'CREATE_USER', 'UPDATE_USER', 'DELETE_USER',
  'CREATE_SISWA', 'UPDATE_SISWA', 'DELETE_SISWA',
  'CREATE_KELAS', 'UPDATE_KELAS', 'DELETE_KELAS',
  'CREATE_PRESENSI', 'UPDATE_PRESENSI', 'DELETE_PRESENSI',
  'UPDATE_JAM_PRESENSI', 'RESET_PASSWORD',
]

const AKSI_LABELS: Record<AksiAudit, string> = {
  LOGIN: 'Login',
  LOGOUT: 'Logout',
  CREATE_USER: 'Tambah Pengguna',
  UPDATE_USER: 'Ubah Pengguna',
  DELETE_USER: 'Hapus Pengguna',
  CREATE_SISWA: 'Tambah Siswa',
  UPDATE_SISWA: 'Ubah Siswa',
  DELETE_SISWA: 'Hapus Siswa',
  CREATE_KELAS: 'Tambah Kelas',
  UPDATE_KELAS: 'Ubah Kelas',
  DELETE_KELAS: 'Hapus Kelas',
  CREATE_PRESENSI: 'Input Presensi',
  UPDATE_PRESENSI: 'Ubah Presensi',
  DELETE_PRESENSI: 'Hapus Presensi',
  UPDATE_JAM_PRESENSI: 'Ubah Jam Presensi',
  RESET_PASSWORD: 'Reset Password',
}

function aksiBadgeVariant(aksi: string): 'success' | 'warning' | 'error' | 'info' | 'default' {
  if (aksi === 'LOGIN') return 'info'
  if (aksi === 'LOGOUT') return 'default'
  if (aksi.startsWith('CREATE_')) return 'success'
  if (aksi.startsWith('UPDATE_')) return 'info'
  if (aksi.startsWith('DELETE_')) return 'error'
  if (aksi === 'RESET_PASSWORD') return 'warning'
  return 'default'
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function getToday() {
  return new Date().toISOString().slice(0, 10)
}

export default function AuditLog() {
  const { error: toastError } = useToast()

  // Filters
  const [filterAksi, setFilterAksi] = useState('')
  const [filterUserId, setFilterUserId] = useState('')
  const [filterTanggalMulai, setFilterTanggalMulai] = useState(getToday())
  const [filterTanggalSelesai, setFilterTanggalSelesai] = useState(getToday())

  // Applied filters (committed by clicking Cari)
  const [appliedAksi, setAppliedAksi] = useState('')
  const [appliedUserId, setAppliedUserId] = useState('')
  const [appliedTanggalMulai, setAppliedTanggalMulai] = useState('')
  const [appliedTanggalSelesai, setAppliedTanggalSelesai] = useState('')

  // Data
  const [logs, setLogs] = useState<any[]>([])
  const [pagination, setPagination] = useState({ page: 1, limit: 50, total: 0, totalPages: 0 })
  const [loading, setLoading] = useState(true)
  const [users, setUsers] = useState<any[]>([])

  const loadUsers = async () => {
    try {
      const data = await api.users.list()
      setUsers(data)
    } catch {
      // silent — users list is auxiliary
    }
  }

  const loadData = async (page = 1) => {
    setLoading(true)
    try {
      const params: any = { page, limit: 50 }
      if (appliedAksi) params.aksi = appliedAksi
      if (appliedUserId) params.userId = appliedUserId
      if (appliedTanggalMulai) params.tanggalMulai = appliedTanggalMulai
      if (appliedTanggalSelesai) params.tanggalSelesai = appliedTanggalSelesai

      const result = await api.admin.auditLogs(params)
      setLogs(result.logs || [])
      if (result.pagination) setPagination(result.pagination)
    } catch (e: any) {
      toastError('Gagal memuat log', e.message)
      setLogs([])
    }
    setLoading(false)
  }

  useEffect(() => {
    loadUsers()
  }, [])

  useEffect(() => {
    loadData(1)
  }, [appliedAksi, appliedUserId, appliedTanggalMulai, appliedTanggalSelesai])

  const handleCari = () => {
    setAppliedAksi(filterAksi)
    setAppliedUserId(filterUserId)
    setAppliedTanggalMulai(filterTanggalMulai)
    setAppliedTanggalSelesai(filterTanggalSelesai)
  }

  const goToPage = (page: number) => {
    loadData(page)
  }

  const anomalyCount = logs.filter(l => l.isAnomaly).length
  const pageStart = (pagination.page - 1) * pagination.limit + 1
  const pageEnd = Math.min(pagination.page * pagination.limit, pagination.total)

  const renderPageNumbers = () => {
    const pages: React.ReactNode[] = []
    const { page, totalPages } = pagination
    const start = Math.max(1, page - 2)
    const end = Math.min(totalPages, page + 2)

    if (start > 1) {
      pages.push(
        <button key={1} onClick={() => goToPage(1)} className="pagination-btn">1</button>,
      )
      if (start > 2) pages.push(<span key="start-dots" className="px-1.5 text-text-muted text-sm">...</span>)
    }

    for (let i = start; i <= end; i++) {
      pages.push(
        <button
          key={i}
          onClick={() => goToPage(i)}
          className={`pagination-btn ${i === page ? 'pagination-btn-active' : ''}`}
        >
          {i}
        </button>,
      )
    }

    if (end < totalPages) {
      if (end < totalPages - 1) pages.push(<span key="end-dots" className="px-1.5 text-text-muted text-sm">...</span>)
      pages.push(
        <button key={totalPages} onClick={() => goToPage(totalPages)} className="pagination-btn">{totalPages}</button>,
      )
    }

    return pages
  }

  if (loading && logs.length === 0) return <TableSkeleton rows={8} cols={6} />

  return (
    <div className="space-y-5">
      <div className="page-header">
        <div>
          <h1 className="page-title">Log Aktivitas</h1>
          <p className="page-desc">Riwayat aktivitas pengguna dalam sistem</p>
        </div>
      </div>

      {/* ── Anomaly Banner ── */}
      {anomalyCount > 0 && (
        <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber-800">
              Terdeteksi {anomalyCount} aktivitas mencurigakan
            </p>
            <p className="text-xs text-amber-700 mt-0.5">
              Aktivitas yang terdeteksi di akhir pekan, di luar jam wajar, atau tindakan sensitif
            </p>
          </div>
        </div>
      )}

      {/* ── Filter Bar ── */}
      <div className="card">
        <div className="flex items-center gap-2 mb-3">
          <Filter className="w-4 h-4 text-text-muted" />
          <span className="text-xs font-semibold text-text-secondary">Filter</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div>
            <label className="label">Aksi</label>
            <select
              className="select"
              value={filterAksi}
              onChange={(e) => setFilterAksi(e.target.value)}
            >
              <option value="">Semua Aksi</option>
              {AKSI_AUDIT_VALUES.map((aksi) => (
                <option key={aksi} value={aksi}>{AKSI_LABELS[aksi]}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Pengguna</label>
            <select
              className="select"
              value={filterUserId}
              onChange={(e) => setFilterUserId(e.target.value)}
            >
              <option value="">Semua Pengguna</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>{u.nama} ({u.username})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Tanggal Mulai</label>
            <input
              type="date"
              className="input"
              value={filterTanggalMulai}
              onChange={(e) => setFilterTanggalMulai(e.target.value)}
            />
          </div>
          <div>
            <label className="label">Tanggal Selesai</label>
            <input
              type="date"
              className="input"
              value={filterTanggalSelesai}
              onChange={(e) => setFilterTanggalSelesai(e.target.value)}
            />
          </div>
        </div>
        <div className="mt-3 flex justify-end">
          <Button size="sm" onClick={handleCari}>
            <Search className="w-3.5 h-3.5" />
            Cari
          </Button>
        </div>
      </div>

      {/* ── Table ── */}
      <div className="card p-0">
        {logs.length === 0 ? (
          <EmptyState
            icon={<Activity className="w-6 h-6" />}
            title="Belum ada aktivitas"
            description="Belum ada log aktivitas yang tercatat dalam sistem"
          />
        ) : (
          <>
            <div className="table-container border-0 rounded-none">
              <table className="table">
                <thead>
                  <tr>
                    <th className="w-12">No</th>
                    <th className="w-36">Waktu</th>
                    <th>User</th>
                    <th className="w-40">Aksi</th>
                    <th>Deskripsi</th>
                    <th className="w-28">IP</th>
                    <th className="w-16 text-center">Anomali</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log, i) => (
                    <tr
                      key={log.id}
                      className={log.isAnomaly ? 'bg-amber-50/60 border-l-2 border-l-amber-400' : ''}
                    >
                      <td className="text-text-muted text-center">{pageStart + i}</td>
                      <td className="text-xs text-text-secondary whitespace-nowrap">{formatDate(log.createdAt)}</td>
                      <td>
                        {log.user ? (
                          <div>
                            <span className="font-semibold text-sm">{log.user.nama}</span>
                            <span className="text-text-muted text-xs ml-1">
                              ({log.user.role === 'ADMIN' ? 'Admin' : 'Guru'})
                            </span>
                          </div>
                        ) : (
                          <span className="text-text-muted text-xs">-</span>
                        )}
                      </td>
                      <td>
                        <Badge variant={aksiBadgeVariant(log.aksi)}>
                          {AKSI_LABELS[log.aksi as AksiAudit] || log.aksi}
                        </Badge>
                      </td>
                      <td className="text-sm text-text-secondary max-w-xs truncate">{log.deskripsi || '-'}</td>
                      <td className="text-xs font-mono text-text-muted">{log.ip || '-'}</td>
                      <td className="text-center">
                        {log.isAnomaly ? (
                          <span className="inline-flex items-center gap-1 text-amber-600" title={log.anomalyReason || ''}>
                            <AlertTriangle className="w-4 h-4" />
                          </span>
                        ) : (
                          <span className="inline-flex items-center text-green-500">
                            <CheckCircle className="w-4 h-4" />
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* ── Pagination ── */}
            {pagination.totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-border">
                <p className="text-xs text-text-muted">
                  Menampilkan {pageStart}–{pageEnd} dari {pagination.total}
                </p>
                <div className="flex items-center gap-1">
                  <button
                    className="pagination-btn"
                    disabled={pagination.page <= 1}
                    onClick={() => goToPage(pagination.page - 1)}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  {renderPageNumbers()}
                  <button
                    className="pagination-btn"
                    disabled={pagination.page >= pagination.totalPages}
                    onClick={() => goToPage(pagination.page + 1)}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
