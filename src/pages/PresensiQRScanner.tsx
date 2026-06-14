import { useEffect, useRef, useState, useCallback } from 'react'
import { Html5Qrcode } from 'html5-qrcode'
import { api } from '@/lib/api'
import { useToast } from '@/contexts/ToastContext'
import {
  ScanLine, CheckCircle2, Clock, Users, Camera,
  RotateCw, AlertTriangle,
} from 'lucide-react'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'

type ScanResult = {
  siswaId: string
  nama: string
  nis: string
  kelas: string
  status: string
  jamDatang: string
}

const DIV_ID = 'qr-presensi-reader'

export default function PresensiQRScanner() {
  const { success: toastSuccess, error: toastError, warning: toastWarning } = useToast()
  const [mode, setMode] = useState<'idle' | 'scanning' | 'result' | 'error'>('idle')
  const [cameraError, setCameraError] = useState('')
  const [lastResult, setLastResult] = useState<ScanResult | null>(null)
  const [recentScans, setRecentScans] = useState<ScanResult[]>([])
  const [initialLoading, setInitialLoading] = useState(true)
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment')

  // Refs — stabil, gak kena re-render
  const scannerRef = useRef<Html5Qrcode | null>(null)
  const modeRef = useRef(mode)
  const facingRef = useRef(facingMode)
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  // Sinkronkan ref dengan state
  useEffect(() => { modeRef.current = mode }, [mode])
  useEffect(() => { facingRef.current = facingMode }, [facingMode])

  // ── Load recent scans ──
  const loadRecentScans = useCallback(async () => {
    try {
      const data = await api.presensi.recentQr()
      setRecentScans(data)
    } catch { /* silent */ }
    setInitialLoading(false)
  }, [])
  useEffect(() => { loadRecentScans() }, [loadRecentScans])

  // ── Control kamera via useEffect(mode, facingMode) ──
  // Scanner div SELALU ada di DOM. Kamera start/stop dikontrol dari sini.
  useEffect(() => {
    const shouldScan = mode === 'scanning'

    if (!shouldScan) {
      // Mode bukan scanning → matikan kamera
      stopCamera()
      return
    }

    // Mode scanning → hidupkan kamera
    let active = true
    const currentFacing = facingMode

    async function startCam() {
      await new Promise(r => setTimeout(r, 150)) // tunggu DOM stabil

      if (!active || modeRef.current !== 'scanning') return

      try {
        const scanner = new Html5Qrcode(DIV_ID)
        scannerRef.current = scanner

        await scanner.start(
          { facingMode: currentFacing },
          { fps: 10, qrbox: { width: 280, height: 280 } },
          // onScanSuccess
          (decodedText) => {
            if (!active || modeRef.current !== 'scanning') return
            handleScanResult(decodedText)
          },
          () => {}, // onScanFailure
        )
      } catch (err: any) {
        if (!active) return
        const msg = String(err?.message || err || '')
        handleCameraError(msg, currentFacing)
      }
    }

    startCam()

    return () => { active = false }
  }, [mode, facingMode])

  // Cleanup total pas unmount
  useEffect(() => {
    return () => {
      stopCamera()
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [])

  // ── Hentikan kamera paksa ──
  function stopCamera() {
    if (timerRef.current) clearTimeout(timerRef.current)

    // Nuclear option: stop semua video track langsung
    try {
      const videoEl = document.querySelector(`#${DIV_ID} video`) as HTMLVideoElement
      if (videoEl?.srcObject) {
        const stream = videoEl.srcObject as MediaStream
        stream.getTracks().forEach(t => { try { t.stop() } catch {} })
        videoEl.srcObject = null
      }
    } catch {}

    if (scannerRef.current) {
      try { scannerRef.current.stop() } catch {}
      try { (scannerRef.current as any).clear() } catch {}
      scannerRef.current = null
    }
  }

  // ── Handle hasil scan ──
  async function handleScanResult(decodedText: string) {
    let qrData: any
    try {
      qrData = JSON.parse(decodedText)
    } catch {
      toastWarning('QR tidak valid', 'QR Code tidak dikenali')
      return
    }

    if (qrData.type !== 'SISWA') {
      toastWarning('QR tidak valid', 'QR Code ini bukan untuk presensi siswa')
      return
    }

    stopCamera()
    setMode('result')
    setLastResult(null)

    try {
      const result = await api.presensi.qr(qrData)
      const scanItem: ScanResult = {
        siswaId: result.siswaId,
        nama: result.nama,
        nis: result.nis,
        kelas: result.kelas,
        status: result.status,
        jamDatang: result.jamDatang,
      }

      setLastResult(scanItem)
      toastSuccess('Presensi berhasil!', `${result.nama} — ${result.status === 'HADIR' ? 'Hadir' : 'Terlambat'}`)
      setRecentScans(prev => [scanItem, ...prev.filter(s => s.siswaId !== scanItem.siswaId)])

      // Auto-restart 1.5 detik
      timerRef.current = setTimeout(() => setMode('scanning'), 1500)
    } catch (err: any) {
      if (err.message?.includes('sudah')) {
        toastWarning('Sudah absen', err.message)
      } else {
        toastError('Gagal', err.message || 'Gagal memproses QR')
      }
      timerRef.current = setTimeout(() => setMode('scanning'), 1000)
    }
  }

  // ── Handle error kamera ──
  function handleCameraError(msg: string, currentFacing: string) {
    if (currentFacing === 'environment' && (msg.includes('NotFoundError') || msg.includes('NotAllowedError'))) {
      setFacingMode('user')
      setMode('scanning') // tetap di scanning, useEffect akan restart dengan facingMode baru
      return
    }

    setCameraError(
      msg.includes('NotFoundError') ? 'Tidak ditemukan kamera' :
      msg.includes('NotAllowedError') ? 'Izin kamera ditolak' :
      msg.includes('NotReadableError') ? 'Kamera sedang dipakai aplikasi lain' :
      msg || 'Tidak dapat mengakses kamera',
    )
    setMode('error')
  }

  const stopAndIdle = useCallback(() => {
    stopCamera()
    setMode('idle')
    setLastResult(null)
  }, [])

  const statusBadge = (status: string) => {
    const variant =
      status === 'HADIR' ? 'success' :
      status === 'TERLAMBAT' ? 'warning' :
      status === 'IZIN' ? 'info' :
      status === 'SAKIT' ? 'warning' : 'error'
    const label =
      status === 'HADIR' ? 'Hadir' :
      status === 'TERLAMBAT' ? 'Telat' :
      status === 'IZIN' ? 'Izin' :
      status === 'SAKIT' ? 'Sakit' : 'Alfa'
    return <Badge variant={variant as any}>{label}</Badge>
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="page-title">Presensi QR Code</h1>
        <p className="page-desc">Scan kartu QR siswa untuk presensi cepat</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        {/* ── Kolom Scanner ── */}
        <div className="lg:col-span-3">
          <div className="card overflow-hidden">
            {/* Status bar */}
            {mode === 'scanning' && (
              <div className="flex items-center justify-between px-4 py-2 bg-primary/5 border-b border-primary/10">
                <div className="flex items-center gap-2 text-sm font-medium text-primary">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary" />
                  </span>
                  Kamera aktif — Arahkan ke QR Code siswa
                </div>
                <Button onClick={stopAndIdle} variant="ghost" size="sm" className="text-xs text-text-muted">
                  Hentikan
                </Button>
              </div>
            )}

            {/* Error kamera */}
            {mode === 'error' && (
              <div className="p-6 text-center">
                <div className="w-16 h-16 rounded-full bg-error-bg flex items-center justify-center mx-auto mb-3">
                  <AlertTriangle className="w-7 h-7 text-error-text" />
                </div>
                <p className="text-sm font-semibold text-error mb-1">Kamera tidak tersedia</p>
                <p className="text-xs text-text-secondary mb-2">{cameraError}</p>
                {facingMode === 'user' && (
                  <p className="text-xs text-text-muted mb-3">Sudah coba kamera depan & belakang</p>
                )}
                <Button onClick={() => { setCameraError(''); setMode('scanning') }} variant="outline" size="sm">
                  <RotateCw className="w-3.5 h-3.5" />
                  Coba Lagi
                </Button>
              </div>
            )}

            {/* Hasil scan sukses */}
            {mode === 'result' && lastResult && (
              <div className="p-6 text-center">
                <div className="w-20 h-20 rounded-full bg-success-bg flex items-center justify-center mx-auto mb-3 animate-in">
                  <CheckCircle2 className="w-10 h-10 text-success-text" />
                </div>
                <p className="text-lg font-bold text-success-text mb-1">{lastResult.nama}</p>
                <p className="text-sm text-text-secondary mb-1">{lastResult.nis} — {lastResult.kelas}</p>
                <div className="inline-flex items-center gap-1.5 mt-2">
                  {statusBadge(lastResult.status)}
                  <span className="text-xs text-text-muted">
                    {new Date(lastResult.jamDatang).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </span>
                </div>
                <p className="text-xs text-text-muted mt-3">Memulai scan berikutnya...</p>
              </div>
            )}
            {mode === 'result' && !lastResult && (
              <div className="p-6 text-center">
                <div className="w-10 h-10 mx-auto mb-2">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto" />
                </div>
                <p className="text-sm text-text-secondary mt-2">Memproses presensi...</p>
              </div>
            )}

            {/* Idle: viewfinder mock */}
            {mode === 'idle' && (
              <div className="relative cursor-pointer group" onClick={() => setMode('scanning')}>
                <div className="flex flex-col items-center justify-center py-12 px-4">
                  <div className="relative w-56 h-56 mb-6">
                    <div className="absolute inset-0 rounded-2xl border-2 border-dashed border-primary/30" />
                    <div className="absolute top-0 left-0 w-10 h-10 border-t-4 border-l-4 border-primary rounded-tl-2xl" />
                    <div className="absolute top-0 right-0 w-10 h-10 border-t-4 border-r-4 border-primary rounded-tr-2xl" />
                    <div className="absolute bottom-0 left-0 w-10 h-10 border-b-4 border-l-4 border-primary rounded-bl-2xl" />
                    <div className="absolute bottom-0 right-0 w-10 h-10 border-b-4 border-r-4 border-primary rounded-br-2xl" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <ScanLine className="w-12 h-12 text-primary/40" />
                    </div>
                    <div className="absolute left-3 right-3 h-0.5 bg-primary/60 rounded-full animate-scan-line shadow-lg shadow-primary/30" />
                  </div>
                  <p className="text-sm font-semibold text-text mb-1">Mulai Scan QR</p>
                  <p className="text-xs text-text-muted text-center max-w-xs">
                    Arahkan kamera ke kartu QR Code siswa untuk presensi cepat
                  </p>
                  <Button className="mt-4">
                    <Camera className="w-4 h-4" />
                    Buka Kamera
                  </Button>
                </div>
              </div>
            )}

            {/* ── Div scanner — SELALU ADA di DOM, tidak pernah di-remove ── */}
            {/* Html5Qrcode butuh elemen ini exist waktu new Html5Qrcode() dipanggil */}
            <div className={mode === 'scanning' ? 'relative block' : 'hidden'}>
              <div id={DIV_ID} />

              {/* Viewfinder overlay */}
              <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 mx-auto w-64 h-64 pointer-events-none">
                <div className="absolute top-0 left-0 w-12 h-12 border-t-4 border-l-4 border-white/90 rounded-tl-2xl" style={{ filter: 'drop-shadow(0 0 4px rgba(0,0,0,0.3))' }} />
                <div className="absolute top-0 right-0 w-12 h-12 border-t-4 border-r-4 border-white/90 rounded-tr-2xl" style={{ filter: 'drop-shadow(0 0 4px rgba(0,0,0,0.3))' }} />
                <div className="absolute bottom-0 left-0 w-12 h-12 border-b-4 border-l-4 border-white/90 rounded-bl-2xl" style={{ filter: 'drop-shadow(0 0 4px rgba(0,0,0,0.3))' }} />
                <div className="absolute bottom-0 right-0 w-12 h-12 border-b-4 border-r-4 border-white/90 rounded-br-2xl" style={{ filter: 'drop-shadow(0 0 4px rgba(0,0,0,0.3))' }} />
              </div>
            </div>
          </div>
        </div>

        {/* ── Recent Scans ── */}
        <div className="lg:col-span-2">
          <div className="card">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-primary" />
                Scan Hari Ini
              </h2>
              <span className="text-xs text-text-muted bg-slate-100 px-2 py-0.5 rounded-full">
                {recentScans.length} siswa
              </span>
            </div>

            {initialLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-12 bg-slate-100 rounded-lg animate-pulse" />
                ))}
              </div>
            ) : recentScans.length === 0 ? (
              <div className="py-8 text-center">
                <Users className="w-8 h-8 text-text-muted/40 mx-auto mb-2" />
                <p className="text-sm text-text-muted">Belum ada presensi QR hari ini</p>
                <p className="text-xs text-text-muted/60 mt-1">Scan QR siswa untuk memulai</p>
              </div>
            ) : (
              <div className="space-y-1.5 max-h-[460px] overflow-y-auto pr-1 -mr-1">
                {recentScans.map((scan, i) => (
                  <div key={`${scan.siswaId}-${i}`}
                    className="flex items-center gap-3 p-2.5 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors animate-in"
                  >
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <span className="text-xs font-bold text-primary">{scan.nama.charAt(0)}</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-text truncate">{scan.nama}</p>
                      <p className="text-[11px] text-text-muted truncate">{scan.kelas} — {scan.nis}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="mb-0.5">{statusBadge(scan.status)}</div>
                      <p className="text-[10px] text-text-muted">
                        {new Date(scan.jamDatang).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
