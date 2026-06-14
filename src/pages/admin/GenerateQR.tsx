import { useState, useEffect } from 'react'
import { api } from '@/lib/api'
import { useToast } from '@/contexts/ToastContext'
import { Download, QrCode, Loader2, ChevronDown } from 'lucide-react'
import Button from '@/components/ui/Button'
import EmptyState from '@/components/ui/EmptyState'
import { CardSkeleton } from '@/components/ui/Skeleton'

export default function GenerateQR() {
  const { error: toastError, success: toastSuccess } = useToast()
  const [kelas, setKelas] = useState<any[]>([])
  const [selectedKelas, setSelectedKelas] = useState('')
  const [qrData, setQrData] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [mode, setMode] = useState<'kelas' | 'semua'>('kelas')

  useEffect(() => {
    api.kelas.list().then(setKelas).catch(() => {})
  }, [])

  const handleGenerate = async () => {
    if (mode === 'kelas' && !selectedKelas) {
      toastError('Pilih kelas', 'Silakan pilih kelas terlebih dahulu')
      return
    }
    setLoading(true)
    setQrData(null)
    try {
      if (mode === 'semua') {
        const data = await api.qr.semua()
        setQrData(data)
        toastSuccess('QR Code siap', `${data.total} QR Code berhasil dibuat`)
      } else {
        const data = await api.qr.perKelas(selectedKelas)
        setQrData(data)
        toastSuccess('QR Code siap', `Kelas ${data.kelas} — ${data.siswa.length} QR Code`)
      }
    } catch (e: any) {
      toastError('Gagal generate QR', e.message)
    }
    setLoading(false)
  }

  const downloadAll = () => {
    if (!qrData?.siswa) return
    qrData.siswa.forEach((s: any) => {
      const link = document.createElement('a')
      link.href = s.qrCode
      link.download = `QR_${s.nis}_${s.nama.replace(/\s+/g, '_')}.png`
      link.click()
    })
    toastSuccess('Download dimulai', `${qrData.siswa.length} QR Code sedang diunduh`)
  }

  const downloadSingle = (qrCode: string, filename: string) => {
    const link = document.createElement('a')
    link.href = qrCode
    link.download = filename
    link.click()
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="page-title">Generate QR Code</h1>
        <p className="page-desc">Buat QR Code untuk presensi siswa</p>
      </div>

      {/* Controls */}
      <div className="card">
        <div className="toolbar-actions mb-4">
          <Button onClick={() => { setMode('kelas'); setQrData(null) }} variant={mode === 'kelas' ? 'primary' : 'secondary'} size="sm">Per Kelas</Button>
          <Button onClick={() => { setMode('semua'); setQrData(null) }} variant={mode === 'semua' ? 'primary' : 'secondary'} size="sm">Semua Siswa</Button>
        </div>

        <div className="toolbar-row">
          {mode === 'kelas' && (
            <select className="select flex-1 max-w-xs" value={selectedKelas} onChange={(e) => setSelectedKelas(e.target.value)}>
              <option value="">Pilih Kelas</option>
              {kelas.map((k: any) => (
                <option key={k.id} value={k.id}>Kelas {k.nama}</option>
              ))}
            </select>
          )}
          <Button onClick={handleGenerate} loading={loading}>
            {!loading ? <QrCode className="w-4 h-4" /> : null}
            Generate QR Code
          </Button>
        </div>
      </div>

      {/* Results */}
      {qrData && (
        <div className="card animate-in">
          <div className="flex flex-col gap-3 mb-4 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-base font-bold">
              {mode === 'kelas' ? `Kelas ${qrData.kelas}` : `Semua Siswa (${qrData.total})`}
            </h2>
            <Button onClick={downloadAll} variant="secondary" size="sm">
              <Download className="w-3.5 h-3.5" />
              Download Semua
            </Button>
          </div>

          {qrData.siswa.length === 0 ? (
            <EmptyState icon={<QrCode className="w-6 h-6" />} title="Tidak ada data" description="Tidak ada siswa ditemukan" />
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {qrData.siswa.map((s: any) => (
                <div key={s.siswaId} className="p-3 rounded-xl border border-border bg-slate-50 text-center">
                  <img src={s.qrCode} alt={`QR ${s.nama}`} className="w-full max-w-[120px] mx-auto mb-2" />
                  <p className="text-xs font-semibold truncate">{s.nama}</p>
                  <p className="text-[11px] text-text-muted">{s.nis}</p>
                  <Button
                    onClick={() => downloadSingle(s.qrCode, `QR_${s.nis}_${s.nama.replace(/\s+/g, '_')}.png`)}
                    variant="ghost"
                    size="sm"
                    fullWidth
                    className="mt-2 text-xs"
                  >
                    Download
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {!qrData && !loading && (
        <div className="card">
          <EmptyState
            icon={<QrCode className="w-6 h-6" />}
            title="Generate QR Code"
            description="Pilih kelas atau semua siswa, lalu klik Generate"
          />
        </div>
      )}
    </div>
  )
}
