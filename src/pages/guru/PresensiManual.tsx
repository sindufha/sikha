import { useState, useEffect } from 'react'
import { api } from '@/lib/api'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/contexts/ToastContext'
import { STATUS_LABELS, type StatusPresensi } from '@/types'
import { Save, Users } from 'lucide-react'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import EmptyState from '@/components/ui/EmptyState'
import { TableSkeleton } from '@/components/ui/Skeleton'

const STATUS_LIST: { value: StatusPresensi; label: string; color: string; active: string; hover: string }[] = [
  { value: 'HADIR', label: 'Hadir', color: 'bg-white text-success-text border-success/40', active: 'bg-success text-white border-success', hover: 'hover:bg-success/10 hover:border-success' },
  { value: 'IZIN', label: 'Izin', color: 'bg-white text-info-text border-info/40', active: 'bg-info text-white border-info', hover: 'hover:bg-info/10 hover:border-info' },
  { value: 'SAKIT', label: 'Sakit', color: 'bg-white text-warning-text border-warning/40', active: 'bg-warning text-white border-warning', hover: 'hover:bg-warning/10 hover:border-warning' },
  { value: 'TERLAMBAT', label: 'Telat', color: 'bg-white text-orange-600 border-orange/40', active: 'bg-orange-500 text-white border-orange-500', hover: 'hover:bg-orange-50 hover:border-orange-300' },
  { value: 'ALFA', label: 'Alfa', color: 'bg-white text-error-text border-error/40', active: 'bg-error text-white border-error', hover: 'hover:bg-error/10 hover:border-error' },
]

export default function PresensiManual() {
  const { user } = useAuth()
  const { error: toastError, success: toastSuccess, warning: toastWarning } = useToast()
  const [kelas, setKelas] = useState<any[]>([])
  const [siswa, setSiswa] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [selectedKelas, setSelectedKelas] = useState('')
  const [presensiMap, setPresensiMap] = useState<Record<string, StatusPresensi>>({})
  const [keteranganMap, setKeteranganMap] = useState<Record<string, string>>({})

  useEffect(() => {
    if (user?.role === 'GURU') {
      api.guru.dashboard()
        .then((data) => {
          setKelas(data.kelas)
          setSiswa(data.siswa)
          if (data.kelas.length > 0) setSelectedKelas(data.kelas[0].id)
        })
        .catch(() => toastError('Gagal memuat data', 'Tidak dapat memuat data siswa dan kelas'))
        .finally(() => setLoading(false))
    }
  }, [])

  // Reset presensiMap tiap kali ganti kelas
  useEffect(() => {
    const siswaKelasIni = siswa.filter(s => s.kelasId === selectedKelas)
    const defaultHadir: Record<string, StatusPresensi> = {}
    for (const s of siswaKelasIni) {
      if (!s.presensi?.[0]) defaultHadir[s.id] = 'HADIR'
    }
    setPresensiMap(defaultHadir)
    setKeteranganMap({})
  }, [selectedKelas, siswa])

  const filteredSiswa = selectedKelas
    ? siswa.filter((s: any) => s.kelasId === selectedKelas)
    : siswa

  const setStatus = (siswaId: string, status: StatusPresensi) => {
    setPresensiMap(prev => {
      const next = { ...prev, [siswaId]: status }
      return next
    })
    // Reset keterangan if changing away from IZIN/SAKIT
    if (status !== 'IZIN' && status !== 'SAKIT') {
      setKeteranganMap(prev => {
        const next = { ...prev }
        delete next[siswaId]
        return next
      })
    }
  }

  const setKeterangan = (siswaId: string, text: string) => {
    setKeteranganMap(prev => ({ ...prev, [siswaId]: text }))
  }

  const siswaIdsKelasIni = new Set(filteredSiswa.map((s: any) => s.id))
  const presensiKelasIni = Object.entries(presensiMap).filter(([id]) => siswaIdsKelasIni.has(id))
  const hasUnsaved = presensiKelasIni.length > 0

  const handleSave = async () => {
    // Hanya simpan siswa yang ada di kelas yang sedang dipilih
    const entries = presensiKelasIni

    if (entries.length === 0) {
      toastWarning('Belum ada data', 'Pilih status presensi terlebih dahulu')
      return
    }

    setSaving(true)
    try {
      const presensiList = entries.map(([siswaId, status]) => ({
        siswaId,
        status,
        keterangan: status === 'IZIN' || status === 'SAKIT' ? (keteranganMap[siswaId] || undefined) : undefined,
      }))
      await api.presensi.manual(presensiList)
      toastSuccess('Presensi disimpan', `Berhasil menyimpan ${entries.length} data presensi`)

      const updatedSiswa = siswa.map((s: any) => ({
        ...s,
        presensi: presensiMap[s.id] ? [{ status: presensiMap[s.id], keterangan: keteranganMap[s.id] || null }] : s.presensi,
      }))
      setSiswa(updatedSiswa)
      setPresensiMap({})
      setKeteranganMap({})
    } catch (e: any) {
      toastError('Gagal menyimpan', e.message)
    }
    setSaving(false)
  }

  if (loading) return <TableSkeleton rows={8} cols={5} />

  return (
    <div className="space-y-5">
      <div>
        <h1 className="page-title">Presensi Manual</h1>
        <p className="page-desc">Isi kehadiran siswa secara manual</p>
      </div>

      {/* Controls */}
      <div className="card">
        <div className="toolbar-row">
          <div className="flex-1 max-w-xs">
            <label className="label">Pilih Kelas</label>
            <select className="select" value={selectedKelas} onChange={(e) => setSelectedKelas(e.target.value)}>
              {kelas.map((k: any) => (
                <option key={k.id} value={k.id}>Kelas {k.nama}</option>
              ))}
            </select>
          </div>
          <Button onClick={handleSave} loading={saving} disabled={!hasUnsaved} className={hasUnsaved ? '' : 'opacity-40'}>
            <Save className="w-4 h-4" />
            Simpan Presensi
            {hasUnsaved && <span className="ml-1 text-xs bg-white/20 px-1.5 py-0.5 rounded-full">{presensiKelasIni.length}</span>}
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="card p-0">
        {filteredSiswa.length === 0 ? (
          <EmptyState
            icon={<Users className="w-6 h-6" />}
            title="Tidak ada siswa"
            description="Tidak ada siswa di kelas ini"
          />
        ) : (
          <div className="table-container border-0 rounded-none">
            <table className="table">
              <thead>
                <tr>
                  <th className="w-12">No</th>
                  <th>NIS</th>
                  <th>Nama</th>
                  <th className="w-44">Status Hari Ini</th>
                  <th>Pilih Kehadiran</th>
                </tr>
              </thead>
              <tbody>
                {filteredSiswa.map((s: any, i: number) => {
                  const sudahPresensi = s.presensi?.[0]
                  const currentStatus = presensiMap[s.id] || sudahPresensi?.status
                  const currentKeterangan = keteranganMap[s.id] || sudahPresensi?.keterangan || ''

                  return (
                    <tr key={s.id} className={sudahPresensi ? 'opacity-60' : ''}>
                      <td className="text-text-muted text-center">{i + 1}</td>
                      <td className="font-mono text-xs font-medium">{s.nis}</td>
                      <td className="font-semibold">
                        <span>{s.nama}</span>
                      </td>
                      <td>
                        {currentStatus ? (
                          <Badge variant={
                            currentStatus === 'HADIR' ? 'success' :
                            currentStatus === 'IZIN' ? 'info' :
                            currentStatus === 'SAKIT' ? 'warning' :
                            currentStatus === 'TERLAMBAT' ? 'warning' : 'error'
                          }>
                            {STATUS_LABELS[currentStatus as StatusPresensi]}
                          </Badge>
                        ) : (
                          <Badge variant="default">Belum diisi</Badge>
                        )}
                      </td>
                      <td>
                        {sudahPresensi ? (
                          <span className="text-xs text-text-muted">Sudah presensi</span>
                        ) : (
                          <div className="flex flex-col gap-2 min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              {STATUS_LIST.map((item) => {
                                const isSelected = presensiMap[s.id] === item.value
                                return (
                                  <button
                                    key={item.value}
                                    onClick={() => setStatus(s.id, item.value)}
                                    className={`
                                      px-3 py-1.5 rounded-lg text-xs font-semibold border
                                      transition-all duration-150 cursor-pointer
                                      ${isSelected ? item.active : `${item.color} ${item.hover}`}
                                    `}
                                  >
                                    {item.label}
                                  </button>
                                )
                              })}
                            </div>
                            {(presensiMap[s.id] === 'IZIN' || presensiMap[s.id] === 'SAKIT') && (
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-[11px] text-text-muted whitespace-nowrap">
                                  {presensiMap[s.id] === 'IZIN' ? 'Alasan izin:' : 'Keterangan sakit:'}
                                </span>
                                <input
                                  type="text"
                                  className="input py-1 px-2 text-xs flex-1 min-w-0"
                                  placeholder={presensiMap[s.id] === 'IZIN' ? 'Contoh: ada acara keluarga' : 'Contoh: demam'}
                                  value={currentKeterangan}
                                  onChange={(e) => setKeterangan(s.id, e.target.value)}
                                  autoFocus
                                />
                              </div>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
