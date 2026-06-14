import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '@/lib/api'
import { getHariIni } from '@/lib/utils'
import StatCard from '@/components/ui/StatCard'
import PresensiDonut from '@/components/ui/PresensiDonut'
import Badge from '@/components/ui/Badge'
import EmptyState from '@/components/ui/EmptyState'
import { CardSkeleton, TableSkeleton } from '@/components/ui/Skeleton'
import { STATUS_LABELS, type StatusPresensi } from '@/types'
import {
  Users, CheckCircle2, XCircle, Clock, AlertTriangle,
  ClipboardCheck, FileText, School, Bell,
} from 'lucide-react'

const STATUS_BADGE: Record<string, 'success' | 'info' | 'warning' | 'error'> = {
  HADIR: 'success',
  IZIN: 'info',
  SAKIT: 'warning',
  ALFA: 'error',
  TERLAMBAT: 'warning',
}

const DONUT_COLORS = {
  HADIR: '#059669',
  TERLAMBAT: '#d97706',
  IZIN: '#2563eb',
  SAKIT: '#a16207',
  ALFA: '#dc2626',
}

export default function GuruDashboard() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    api.guru.dashboard()
      .then(setData)
      .catch(err => {
        setData(null)
        setError(err.message)
      })
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="space-y-6"><CardSkeleton count={4} /><TableSkeleton rows={5} cols={4} /></div>

  if (error) {
    return (
      <EmptyState
        icon={<XCircle className="w-7 h-7" />}
        title="Gagal memuat data"
        description={error}
      />
    )
  }

  const { stats, siswa, kelas } = data || {}
  const totalPresensi = (stats?.hadir || 0) + (stats?.izin || 0) + (stats?.sakit || 0) + (stats?.alfa || 0)

  const presensiSegments = [
    { label: 'Hadir', value: stats?.hadir || 0, color: DONUT_COLORS.HADIR },
    { label: 'Terlambat', value: stats?.terlambat || 0, color: DONUT_COLORS.TERLAMBAT },
    { label: 'Izin', value: stats?.izin || 0, color: DONUT_COLORS.IZIN },
    { label: 'Sakit', value: stats?.sakit || 0, color: DONUT_COLORS.SAKIT },
    { label: 'Alfa', value: stats?.alfa || 0, color: DONUT_COLORS.ALFA },
  ].filter(s => s.value > 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="animate-in">
        <h1 className="page-title">Dashboard</h1>
        <p className="page-desc">{getHariIni()}</p>
      </div>

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="animate-in animate-in-delay-1">
          <div className="rounded-xl p-5 text-white relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #1e40af, #3b82f6)' }}>
            <div className="absolute inset-0 opacity-10" style={{ background: 'radial-gradient(circle at 100% 0%, rgba(255,255,255,0.4) 0%, transparent 60%)' }} />
            <p className="text-xs font-medium text-white/70 tracking-wide uppercase">Total Siswa</p>
            <p className="text-2xl font-bold mt-1.5 tabular-nums tracking-tight">{stats?.totalSiswa || (siswa?.length || 0)}</p>
            <Users className="w-7 h-7 text-white/15 absolute bottom-3 right-3" />
          </div>
        </div>
        <div className="animate-in animate-in-delay-1">
          <div className="rounded-xl p-5 text-white relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #047857, #10b981)' }}>
            <div className="absolute inset-0 opacity-10" style={{ background: 'radial-gradient(circle at 100% 0%, rgba(255,255,255,0.4) 0%, transparent 60%)' }} />
            <p className="text-xs font-medium text-white/70 tracking-wide uppercase">Hadir</p>
            <p className="text-2xl font-bold mt-1.5 tabular-nums tracking-tight">{stats?.hadir || 0}</p>
            <CheckCircle2 className="w-7 h-7 text-white/15 absolute bottom-3 right-3" />
          </div>
        </div>
        <div className="animate-in animate-in-delay-1">
          <div className="rounded-xl p-5 text-white relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #d97706, #f59e0b)' }}>
            <div className="absolute inset-0 opacity-10" style={{ background: 'radial-gradient(circle at 100% 0%, rgba(255,255,255,0.4) 0%, transparent 60%)' }} />
            <p className="text-xs font-medium text-white/70 tracking-wide uppercase">Belum Presensi</p>
            <p className="text-2xl font-bold mt-1.5 tabular-nums tracking-tight">{stats?.belumPresensi || 0}</p>
            <Clock className="w-7 h-7 text-white/15 absolute bottom-3 right-3" />
          </div>
        </div>
        <div className="animate-in animate-in-delay-1">
          <div className="rounded-xl p-5 text-white relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #0d9488, #14b8a6)' }}>
            <div className="absolute inset-0 opacity-10" style={{ background: 'radial-gradient(circle at 100% 0%, rgba(255,255,255,0.4) 0%, transparent 60%)' }} />
            <p className="text-xs font-medium text-white/70 tracking-wide uppercase">Total Kelas</p>
            <p className="text-2xl font-bold mt-1.5 tabular-nums tracking-tight">{kelas?.length || 0}</p>
            <School className="w-7 h-7 text-white/15 absolute bottom-3 right-3" />
          </div>
        </div>
      </div>

      {/* ── Grafik & Info Kelas ── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        {/* Donut Chart */}
        <div className="lg:col-span-2 card animate-in animate-in-delay-2">
          <h2 className="text-sm font-bold mb-4">Presensi Hari Ini</h2>
          {totalPresensi === 0 ? (
            <div className="py-8 text-center">
              <Clock className="w-8 h-8 text-text-muted/40 mx-auto mb-2" />
              <p className="text-sm text-text-muted">Belum ada data presensi</p>
            </div>
          ) : (
            <PresensiDonut segments={presensiSegments} total={totalPresensi} />
          )}
        </div>

        {/* Kelas Info + Stats */}
        <div className="lg:col-span-3 card animate-in animate-in-delay-2">
          <h2 className="text-sm font-bold mb-4">Kelas</h2>
          {kelas?.map((k: any) => (
            <div key={k.id} className="flex items-center gap-3.5 p-3.5 rounded-xl bg-gradient-to-r from-blue-50/80 to-transparent border border-blue-100/60 mb-3 last:mb-0 hover:border-blue-200/80 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shrink-0 shadow-xs">
                <School className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-text">Kelas {k.nama}</p>
                <p className="text-xs text-text-muted mt-0.5">{k._count.siswa} siswa</p>
              </div>
            </div>
          ))}

          {/* Stat detail breakdown */}
          {stats && (
            <div className="grid grid-cols-5 gap-2 mt-4">
              {[
                { label: 'Hadir', value: stats.hadir, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                { label: 'Telat', value: stats.terlambat, color: 'text-orange-600', bg: 'bg-orange-50' },
                { label: 'Izin', value: stats.izin, color: 'text-blue-600', bg: 'bg-blue-50' },
                { label: 'Sakit', value: stats.sakit, color: 'text-amber-600', bg: 'bg-amber-50' },
                { label: 'Alfa', value: stats.alfa, color: 'text-red-600', bg: 'bg-red-50' },
              ].map(s => (
                <div key={s.label} className={`text-center p-2.5 rounded-lg ${s.bg} border border-white/50`}>
                  <span className={`text-sm font-bold tabular-nums ${s.color}`}>{s.value}</span>
                  <p className="text-[11px] text-text-muted font-medium mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Alert ── */}
      {stats?.belumPresensi > 0 && (
        <div className="flex items-start gap-3.5 p-4 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/60 animate-in animate-in-delay-2">
          <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
            <Bell className="w-4.5 h-4.5 text-amber-600" />
          </div>
          <div className="flex-1 min-w-0 pt-0.5">
            <p className="text-sm font-semibold text-amber-800">
              {stats.belumPresensi} siswa belum melakukan presensi
            </p>
            <p className="text-xs text-amber-600/80 mt-0.5">Gunakan presensi manual atau QR untuk mencatat kehadiran</p>
          </div>
        </div>
      )}

      {/* ── Student List ── */}
      <div className="card animate-in animate-in-delay-3">
        <h2 className="text-base font-bold mb-4">Siswa Hari Ini</h2>
        {(!siswa || siswa.length === 0) ? (
          <EmptyState icon={<Users className="w-6 h-6" />} title="Belum ada data siswa" description="Tidak ada siswa untuk ditampilkan" />
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>NIS</th>
                  <th>Nama</th>
                  <th>Kelas</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {siswa.map((s: any) => (
                  <tr key={s.id}>
                    <td className="font-mono text-xs font-medium">{s.nis}</td>
                    <td className="font-semibold">{s.nama}</td>
                    <td className="text-text-secondary">{s.kelas?.nama}</td>
                    <td>
                      {s.presensi?.[0] ? (
                        <Badge variant={STATUS_BADGE[s.presensi[0].status] || 'default'}>
                          {STATUS_LABELS[s.presensi[0].status as StatusPresensi]}
                        </Badge>
                      ) : (
                        <Badge variant="default">Belum</Badge>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Quick Actions ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-in animate-in-delay-3">
        <button onClick={() => navigate('/guru/presensi-manual')} className="card-button p-4 flex items-center gap-4 hover:border-emerald-300/60 hover:shadow-md transition-all duration-200">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shrink-0 shadow-sm">
            <ClipboardCheck className="w-5 h-5 text-white" />
          </div>
          <div className="text-left min-w-0">
            <h3 className="font-semibold text-sm text-text">Presensi Manual</h3>
            <p className="text-xs text-text-muted mt-0.5">Isi presensi siswa secara manual</p>
          </div>
        </button>
        <button onClick={() => navigate('/guru/laporan')} className="card-button p-4 flex items-center gap-4 hover:border-primary/30 hover:shadow-md transition-all duration-200">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shrink-0 shadow-sm">
            <FileText className="w-5 h-5 text-white" />
          </div>
          <div className="text-left min-w-0">
            <h3 className="font-semibold text-sm text-text">Laporan Presensi</h3>
            <p className="text-xs text-text-muted mt-0.5">Lihat dan cetak laporan kehadiran</p>
          </div>
        </button>
      </div>
    </div>
  )
}
