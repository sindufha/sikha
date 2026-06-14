import { useState, useEffect } from 'react'
import { api } from '@/lib/api'
import { useToast } from '@/contexts/ToastContext'
import { Clock, Save } from 'lucide-react'
import Button from '@/components/ui/Button'
import FormField from '@/components/ui/FormField'
import Skeleton from '@/components/ui/Skeleton'

export default function PengaturanJam() {
  const { error: toastError, success: toastSuccess } = useToast()
  const [form, setForm] = useState({ jamMasuk: '07:00', toleransiMenit: 15, jamPulang: '' })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    api.jamPresensi.get()
      .then((data) => {
        if (data) {
          setForm({
            jamMasuk: data.jamMasuk || '07:00',
            toleransiMenit: data.toleransiMenit || 15,
            jamPulang: data.jamPulang || '',
          })
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const handleSave = async () => {
    setSaving(true)
    try {
      await api.jamPresensi.update(form)
      toastSuccess('Pengaturan disimpan', 'Jam presensi berhasil diperbarui')
    } catch (e: any) {
      toastError('Gagal menyimpan', e.message)
    }
    setSaving(false)
  }

  if (loading) {
    return (
      <div className="space-y-5">
        <div><h1 className="page-title">Pengaturan Jam Presensi</h1><p className="page-desc">Memuat...</p></div>
        <div className="card max-w-lg space-y-4">
          <Skeleton className="h-10 w-full" count={4} />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="page-title">Pengaturan Jam Presensi</h1>
        <p className="page-desc">Atur jam masuk, toleransi keterlambatan, dan jam pulang</p>
      </div>

      <div className="card max-w-lg">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-lg bg-primary-50 flex items-center justify-center">
            <Clock className="w-5 h-5 text-primary-dark" />
          </div>
          <div>
            <h2 className="text-sm font-bold">Jam Presensi</h2>
            <p className="text-xs text-text-secondary">Pengaturan untuk menentukan status Hadir / Terlambat</p>
          </div>
        </div>

        <div className="space-y-4">
          <FormField label="Jam Masuk">
            <input
              type="time"
              className="input"
              value={form.jamMasuk}
              onChange={(e) => setForm({ ...form, jamMasuk: e.target.value })}
            />
          </FormField>

          <FormField label="Toleransi Keterlambatan (menit)" helperText={`Siswa dianggap terlambat jika presensi setelah ${form.jamMasuk} + ${form.toleransiMenit} menit`}>
            <input
              type="number"
              className="input"
              value={form.toleransiMenit}
              onChange={(e) => setForm({ ...form, toleransiMenit: parseInt(e.target.value) || 0 })}
              min={0}
              max={120}
            />
          </FormField>

          <FormField label="Jam Pulang (opsional)">
            <input
              type="time"
              className="input"
              value={form.jamPulang}
              onChange={(e) => setForm({ ...form, jamPulang: e.target.value })}
            />
          </FormField>

          <Button onClick={handleSave} fullWidth loading={saving}>
            <Save className="w-4 h-4" />
            Simpan Pengaturan
          </Button>
        </div>
      </div>
    </div>
  )
}
