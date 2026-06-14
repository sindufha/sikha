import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '@/lib/api'
import { getHariIni } from '@/lib/utils'
import StatCard from '@/components/ui/StatCard'
import PresensiDonut from '@/components/ui/PresensiDonut'
import { CardSkeleton, TableSkeleton } from '@/components/ui/Skeleton'
import EmptyState from '@/components/ui/EmptyState'
import {
  Users, GraduationCap, Shield, CheckCircle2,
  XCircle, Clock, AlertTriangle, UserCheck, QrCode,
} from 'lucide-react'

const DONUT_COLORS = {
  HADIR: '#059669',
  TERLAMBAT: '#d97706',
  IZIN: '#2563eb',
  SAKIT: '#a16207',
  ALFA: '#dc2626',
}

export default function AdminDashboard() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    api.admin.dashboard()
      .then(setData)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="space-y-6"><CardSkeleton count={4} /><CardSkeleton count={3} /><TableSkeleton rows={4} cols={3} /></div>

  if (error) {
    return (
      <EmptyState
        icon={<XCircle className="w-7 h-7" />}
        title="Gagal memuat data"
        description={error}
      />
    )
  }

  const { stats, daftarKelas } = data
  const presensiSegments = [
    { label: 'Hadir', value: stats.hadir, color: DONUT_COLORS.HADIR },
    { label: 'Terlambat', value: stats.terlambat, color: DONUT_COLORS.TERLAMBAT },
    { label: 'Izin', value: stats.izin, color: DONUT_COLORS.IZIN },
    { label: 'Sakit', value: stats.sakit, color: DONUT_COLORS.SAKIT },
    { label: 'Alfa', value: stats.alfa, color: DONUT_COLORS.ALFA },
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
            <p className="text-2xl font-bold mt-1.5 tabular-nums tracking-tight">{stats.totalSiswa}</p>
            <Users className="w-7 h-7 text-white/15 absolute bottom-3 right-3" />
          </div>
        </div>
        <div className="animate-in animate-in-delay-1">
          <div className="rounded-xl p-5 text-white relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #0d9488, #14b8a6)' }}>
            <div className="absolute inset-0 opacity-10" style={{ background: 'radial-gradient(circle at 100% 0%, rgba(255,255,255,0.4) 0%, transparent 60%)' }} />
            <p className="text-xs font-medium text-white/70 tracking-wide uppercase">Total Kelas</p>
            <p className="text-2xl font-bold mt-1.5 tabular-nums tracking-tight">{stats.totalKelas}</p>
            <GraduationCap className="w-7 h-7 text-white/15 absolute bottom-3 right-3" />
          </div>
        </div>
        <div className="animate-in animate-in-delay-1">
          <div className="rounded-xl p-5 text-white relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #6d28d9, #8b5cf6)' }}>
            <div className="absolute inset-0 opacity-10" style={{ background: 'radial-gradient(circle at 100% 0%, rgba(255,255,255,0.4) 0%, transparent 60%)' }} />
            <p className="text-xs font-medium text-white/70 tracking-wide uppercase">Total Guru</p>
            <p className="text-2xl font-bold mt-1.5 tabular-nums tracking-tight">{stats.totalGuru}</p>
            <Shield className="w-7 h-7 text-white/15 absolute bottom-3 right-3" />
          </div>
        </div>
        <div className="animate-in animate-in-delay-1">
          <div className="rounded-xl p-5 text-white relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #047857, #10b981)' }}>
            <div className="absolute inset-0 opacity-10" style={{ background: 'radial-gradient(circle at 100% 0%, rgba(255,255,255,0.4) 0%, transparent 60%)' }} />
            <p className="text-xs font-medium text-white/70 tracking-wide uppercase">Presensi Hari Ini</p>
            <p className="text-2xl font-bold mt-1.5 tabular-nums tracking-tight">{stats.totalPresensiHariIni}</p>
            <UserCheck className="w-7 h-7 text-white/15 absolute bottom-3 right-3" />
          </div>
        </div>
      </div>

      {/* ── Grafik Presensi ── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        {/* Donut Chart */}
        <div className="lg:col-span-2 card animate-in animate-in-delay-2">
          <h2 className="text-sm font-bold mb-4">Presensi Hari Ini</h2>
          {stats.totalPresensiHariIni === 0 ? (
            <div className="py-8 text-center">
              <Clock className="w-8 h-8 text-text-muted/40 mx-auto mb-2" />
              <p className="text-sm text-text-muted">Belum ada data presensi</p>
            </div>
          ) : (
            <PresensiDonut segments={presensiSegments} total={stats.totalPresensiHariIni} />
          )}
        </div>

        {/* Per-Class Stats */}
        <div className="lg:col-span-3 card animate-in animate-in-delay-2">
          <h2 className="text-sm font-bold mb-4">Kehadiran Per Kelas</h2>
          {daftarKelas.length === 0 ? (
            <EmptyState icon={<GraduationCap className="w-6 h-6" />} title="Belum ada kelas" description="Tambahkan kelas untuk memulai" />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {daftarKelas.map((k: any, i: number) => {
                const colors = ['#3b82f6', '#0d9488', '#6d28d9', '#059669']
                const color = colors[i % colors.length]
                return (
                  <div
                    key={k.id}
                    className="p-3 rounded-xl border border-border hover:shadow-sm transition-shadow"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold">Kelas {k.nama}</span>
                      <span className="text-[11px] text-text-muted tabular-nums">{k._count.siswa} siswa</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${Math.min(100, (k._count.siswa / 15) * 100)}%`, background: `linear-gradient(90deg, ${color}, ${color}88)` }}
                      />
                    </div>
                    <p className="text-[11px] text-text-muted mt-1.5">
                      <span className="font-medium" style={{ color }}>{k.waliKelas?.nama || '—'}</span>
                    </p>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Status Breakdown ── */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <div className="animate-in animate-in-delay-2"><StatCard label="Hadir" value={stats.hadir} icon={<CheckCircle2 className="w-5 h-5" />} color="success" /></div>
        <div className="animate-in animate-in-delay-2"><StatCard label="Terlambat" value={stats.terlambat} icon={<Clock className="w-5 h-5" />} color="warning" /></div>
        <div className="animate-in animate-in-delay-2"><StatCard label="Izin" value={stats.izin} icon={<Clock className="w-5 h-5" />} color="info" /></div>
        <div className="animate-in animate-in-delay-2"><StatCard label="Sakit" value={stats.sakit} icon={<AlertTriangle className="w-5 h-5" />} color="warning" /></div>
        <div className="animate-in animate-in-delay-2"><StatCard label="Alfa" value={stats.alfa} icon={<XCircle className="w-5 h-5" />} color="error" /></div>
      </div>

      {/* ── Daftar Kelas ── */}
      <div className="card animate-in animate-in-delay-3">
        <h2 className="text-base font-bold mb-4">Daftar Kelas</h2>
        {daftarKelas.length === 0 ? (
          <EmptyState icon={<GraduationCap className="w-6 h-6" />} title="Belum ada kelas" description="Tambahkan kelas untuk memulai" />
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Kelas</th>
                  <th>Wali Kelas</th>
                  <th>Jumlah Siswa</th>
                </tr>
              </thead>
              <tbody>
                {daftarKelas.map((k: any) => (
                  <tr key={k.id}>
                    <td className="font-semibold">Kelas {k.nama}</td>
                    <td>{k.waliKelas?.nama || <span className="text-text-muted italic">Belum ada</span>}</td>
                    <td>{k._count.siswa} siswa</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Quick Actions ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-in animate-in-delay-3">
        <button onClick={() => navigate('/admin/siswa')} className="card-button p-4 flex items-center gap-4 hover:border-primary/30 hover:shadow-md transition-all duration-200">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shrink-0 shadow-sm">
            <Users className="w-5 h-5 text-white" />
          </div>
          <div className="text-left min-w-0">
            <h3 className="font-semibold text-sm text-text">Kelola Siswa</h3>
            <p className="text-xs text-text-muted mt-0.5">Tambah, ubah, dan hapus data siswa</p>
          </div>
        </button>
        <button onClick={() => navigate('/admin/generate-qr')} className="card-button p-4 flex items-center gap-4 hover:border-primary/30 hover:shadow-md transition-all duration-200">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-violet-600 flex items-center justify-center shrink-0 shadow-sm">
            <QrCode className="w-5 h-5 text-white" />
          </div>
          <div className="text-left min-w-0">
            <h3 className="font-semibold text-sm text-text">Generate QR Code</h3>
            <p className="text-xs text-text-muted mt-0.5">Buat QR Code per kelas atau semua siswa</p>
          </div>
        </button>
      </div>
    </div>
  )
}
