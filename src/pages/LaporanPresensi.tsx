import { useState, useEffect } from 'react'
import { api } from '@/lib/api'
import { useAuth } from '@/contexts/AuthContext'
import { Search, FileText, Download } from 'lucide-react'
import { useToast } from '@/contexts/ToastContext'
import { STATUS_LABELS, type StatusPresensi } from '@/types'
import { getCurrentDate } from '@/lib/utils'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import EmptyState from '@/components/ui/EmptyState'
import { TableSkeleton } from '@/components/ui/Skeleton'
import { exportLaporanToExcel, exportLaporanToPdf } from '@/lib/laporanExport'
import LaporanCetakModal from '@/components/LaporanCetakModal'

const STATUS_BADGE: Record<string, 'success' | 'info' | 'warning' | 'error'> = {
  HADIR: 'success',
  IZIN: 'info',
  SAKIT: 'warning',
  ALFA: 'error',
  TERLAMBAT: 'warning',
}

export default function LaporanPresensi() {
  const { user } = useAuth()
  const isAdmin = user?.role === 'ADMIN'
  const { error: toastError } = useToast()
  const [data, setData] = useState<any[]>([])
  const [kelas, setKelas] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [cetakOpen, setCetakOpen] = useState(false)
  const [filters, setFilters] = useState({
    kelasId: '',
    tanggalMulai: getCurrentDate(),
    tanggalSelesai: getCurrentDate(),
    status: '',
  })

  const loadData = async () => {
    setLoading(true)
    try {
      const params: any = {}
      if (filters.kelasId) params.kelasId = filters.kelasId
      if (filters.tanggalMulai) params.tanggalMulai = filters.tanggalMulai
      if (filters.tanggalSelesai) params.tanggalSelesai = filters.tanggalSelesai
      if (filters.status) params.status = filters.status
      const result = await api.laporan.list(params)
      setData(result)
    } catch (e: any) {
      toastError('Gagal memuat data', e?.message || 'Terjadi kesalahan')
    }
    setLoading(false)
  }

  useEffect(() => {
    if (isAdmin) {
      api.kelas.list().then(setKelas).catch(() => {})
    }
  }, [])

  useEffect(() => { loadData() }, [])

  const formatTanggal = (date: Date | string) =>
    new Date(date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })

  const formatJam = (date?: Date | string | null) =>
    date ? new Date(date).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '-'

  const getFilterLabel = () => {
    if (isAdmin && filters.kelasId) {
      return `Kelas ${kelas.find((k: any) => k.id === filters.kelasId)?.nama || '-'}`
    }
    return isAdmin ? 'Semua Kelas' : 'Kelas Saya'
  }

  const handleExportExcel = () => {
    exportLaporanToExcel(data, {
      kelasLabel: getFilterLabel(),
      tanggalMulai: filters.tanggalMulai,
      tanggalSelesai: filters.tanggalSelesai,
      statusLabel: filters.status ? STATUS_LABELS[filters.status as keyof typeof STATUS_LABELS] : 'Semua Status',
      generatedBy: user?.nama,
    })
  }

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="page-title">Laporan Presensi</h1>
          <p className="page-desc">Lihat, filter, dan cetak data kehadiran siswa</p>
        </div>
        <Button onClick={() => setCetakOpen(true)}>
          <Download className="w-4 h-4" />
          Cetak / Export Laporan
        </Button>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5 lg:items-end">
          {isAdmin && (
            <div>
              <label className="label">Kelas</label>
              <select className="select" value={filters.kelasId} onChange={(e) => setFilters({ ...filters, kelasId: e.target.value })}>
                <option value="">Semua Kelas</option>
                {kelas.map((k: any) => (
                  <option key={k.id} value={k.id}>Kelas {k.nama}</option>
                ))}
              </select>
            </div>
          )}
          <div>
            <label className="label">Tanggal Mulai</label>
            <input type="date" className="input" value={filters.tanggalMulai} onChange={(e) => setFilters({ ...filters, tanggalMulai: e.target.value })} />
          </div>
          <div>
            <label className="label">Tanggal Selesai</label>
            <input type="date" className="input" value={filters.tanggalSelesai} onChange={(e) => setFilters({ ...filters, tanggalSelesai: e.target.value })} />
          </div>
          <div>
            <label className="label">Status</label>
            <select className="select" value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}>
              <option value="">Semua Status</option>
              <option value="HADIR">Hadir</option>
              <option value="IZIN">Izin</option>
              <option value="SAKIT">Sakit</option>
              <option value="ALFA">Alfa</option>
              <option value="TERLAMBAT">Terlambat</option>
            </select>
          </div>
          <Button onClick={loadData} fullWidth loading={loading}>
            <Search className="w-4 h-4" />
            Cari
          </Button>
        </div>
      </div>

      {/* Results */}
      <div className="card p-0">
        {loading ? (
          <TableSkeleton rows={8} cols={8} />
        ) : data.length === 0 ? (
          <EmptyState
            icon={<FileText className="w-6 h-6" />}
            title="Tidak ada data presensi"
            description="Coba ubah filter atau pilih tanggal lain"
          />
        ) : (
          <>
            <div className="table-container border-0 rounded-none">
              <table className="table">
                <thead>
                  <tr>
                    <th className="w-12">No</th>
                    <th>Tanggal</th>
                    <th>NIS</th>
                    <th>Nama</th>
                    <th>Kelas</th>
                    <th>Status</th>
                    <th>Jam Datang</th>
                    <th>Keterangan</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((p, i) => (
                    <tr key={p.id}>
                      <td className="text-text-muted text-center">{i + 1}</td>
                      <td className="text-sm text-text-secondary">{formatTanggal(p.tanggal)}</td>
                      <td className="font-mono text-xs font-medium">{p.siswa?.nis || '-'}</td>
                      <td className="font-semibold">{p.siswa?.nama || '-'}</td>
                      <td className="text-text-secondary">{p.siswa?.kelas?.nama || '-'}</td>
                      <td>
                        <Badge variant={STATUS_BADGE[p.status] || 'default'}>
                          {STATUS_LABELS[p.status as keyof typeof STATUS_LABELS]}
                        </Badge>
                      </td>
                      <td className="text-sm text-text-secondary">{formatJam(p.jamDatang)}</td>
                      <td className="text-sm text-text-secondary">{p.keterangan || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            </>
          )}
        </div>

        <LaporanCetakModal
        isOpen={cetakOpen}
        onClose={() => setCetakOpen(false)}
        onPdf={() => exportLaporanToPdf(data, {
          kelasLabel: getFilterLabel(),
          tanggalMulai: filters.tanggalMulai,
          tanggalSelesai: filters.tanggalSelesai,
          statusLabel: filters.status ? STATUS_LABELS[filters.status as keyof typeof STATUS_LABELS] : 'Semua Status',
          generatedBy: user?.nama,
        })}
        onExcel={handleExportExcel}
      />
    </div>
  )
}
