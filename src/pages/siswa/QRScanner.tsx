import { useEffect, useRef, useState } from 'react'
import { Html5Qrcode } from 'html5-qrcode'
import { api } from '@/lib/api'
import { CheckCircle2, XCircle, Camera, Smartphone, School, ScanLine } from 'lucide-react'
import Button from '@/components/ui/Button'

export default function QRScanner() {
  const [scanning, setScanning] = useState(false)
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null)
  const [cameraError, setCameraError] = useState('')
  const scannerRef = useRef<Html5Qrcode | null>(null)
  const scannerDivId = 'qr-reader'

  const startScanner = async () => {
    setScanning(true)
    setResult(null)
    setCameraError('')

    try {
      const scanner = new Html5Qrcode(scannerDivId)
      scannerRef.current = scanner

      await scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        async (decodedText) => {
          try {
            const qrData = JSON.parse(decodedText)
            if (qrData.type === 'SISWA') {
              await scanner.stop()
              setScanning(false)
              const presensiResult = await api.presensi.qr(qrData)
              setResult({
                success: true,
                message: presensiResult.message || 'Presensi berhasil!',
              })
            } else {
              setResult({ success: false, message: 'QR Code tidak valid untuk presensi' })
            }
          } catch {
            setResult({ success: false, message: 'QR Code tidak dikenali. Scan QR Code siswa.' })
          }
        },
        () => {}
      )
    } catch (err: any) {
      setCameraError(err.message || 'Tidak dapat mengakses kamera')
      setScanning(false)
    }
  }

  const stopScanner = async () => {
    if (scannerRef.current) {
      try { await scannerRef.current.stop() } catch {}
      scannerRef.current = null
    }
    setScanning(false)
  }

  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        try { scannerRef.current.stop() } catch {}
      }
    }
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-primary-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary-dark shadow-lg shadow-primary/20 flex items-center justify-center mx-auto mb-3">
            <Smartphone className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-xl font-bold">Presensi QR Code</h1>
          <p className="text-sm text-text-secondary mt-1">Scan QR Code untuk melakukan presensi</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-card border border-border p-5 text-center">
          {!scanning && !result && (
            <div className="py-6">
              <div className="w-24 h-24 rounded-2xl bg-primary-50 flex items-center justify-center mx-auto mb-4">
                <ScanLine className="w-10 h-10 text-primary-dark" />
              </div>
              <p className="text-sm text-text-secondary mb-4">
                Scan QR Code siswa yang telah diberikan oleh sekolah
              </p>
              <Button onClick={startScanner}>
                <Camera className="w-4 h-4" />
                Mulai Scan
              </Button>
            </div>
          )}

          {scanning && (
            <div>
              <div id={scannerDivId} className="mb-3" />
              <Button onClick={stopScanner} variant="ghost" size="sm">
                Batalkan Scan
              </Button>
            </div>
          )}

          {cameraError && (
            <div className="py-6">
              <div className="flex flex-col items-center gap-2 mb-4">
                <XCircle className="w-12 h-12 text-error" />
                <p className="text-sm text-error font-medium">{cameraError}</p>
              </div>
              <p className="text-xs text-text-secondary mb-3">
                Pastikan kamera terhubung dan izin kamera telah diberikan
              </p>
              <Button onClick={startScanner} variant="outline" size="sm">
                Coba Lagi
              </Button>
            </div>
          )}

          {result && (
            <div className="py-6">
              <div className="flex flex-col items-center gap-3 mb-4">
                {result.success ? (
                  <div className="w-16 h-16 rounded-full bg-success-bg flex items-center justify-center">
                    <CheckCircle2 className="w-8 h-8 text-success-text" />
                  </div>
                ) : (
                  <div className="w-16 h-16 rounded-full bg-error-bg flex items-center justify-center">
                    <XCircle className="w-8 h-8 text-error-text" />
                  </div>
                )}
                <p className={`text-base font-bold ${result.success ? 'text-success-text' : 'text-error-text'}`}>
                  {result.success ? 'Berhasil!' : 'Gagal'}
                </p>
                <p className="text-sm text-text-secondary">{result.message}</p>
              </div>
              <Button onClick={() => { setResult(null); startScanner() }}>
                Scan Lagi
              </Button>
            </div>
          )}

          <div className="pt-4 mt-4 border-t border-border">
            <a href="/login" className="text-sm font-medium text-primary hover:text-primary-dark transition-colors">
              Login untuk Admin / Guru
            </a>
          </div>
        </div>

        <p className="text-center text-xs text-text-muted mt-6">
          &copy; 2025 SDI Khadijah Sukorejo
        </p>
      </div>
    </div>
  )
}
