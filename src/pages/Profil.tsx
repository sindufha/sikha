import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '@/lib/api'
import { useToast } from '@/contexts/ToastContext'
import Button from '@/components/ui/Button'
import FormField from '@/components/ui/FormField'

export default function Profil() {
  const navigate = useNavigate()
  const { success, error } = useToast()

  const [passwordLama, setPasswordLama] = useState('')
  const [passwordBaru, setPasswordBaru] = useState('')
  const [konfirmasiPassword, setKonfirmasiPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  function validate(): boolean {
    const newErrors: Record<string, string> = {}

    if (!passwordLama) {
      newErrors.passwordLama = 'Password lama harus diisi'
    }

    if (!passwordBaru) {
      newErrors.passwordBaru = 'Password baru harus diisi'
    } else if (passwordBaru.length < 4) {
      newErrors.passwordBaru = 'Password baru minimal 4 karakter'
    }

    if (passwordBaru !== konfirmasiPassword) {
      newErrors.konfirmasiPassword = 'Konfirmasi password tidak cocok'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return

    setLoading(true)
    try {
      await api.profil.gantiPassword({ passwordLama, passwordBaru })
      success('Password berhasil diubah')
      setPasswordLama('')
      setPasswordBaru('')
      setKonfirmasiPassword('')
    } catch (err) {
      error('Gagal mengubah password', err instanceof Error ? err.message : 'Terjadi kesalahan')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-lg mx-auto">
      <div className="mb-6">
        <h1 className="text-lg font-bold text-text">Profil</h1>
        <p className="text-sm text-text-secondary mt-1">Ubah password akun Anda</p>
      </div>

      <div className="card">
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormField label="Password Lama" error={errors.passwordLama} required>
            <input
              type="password"
              className="input"
              placeholder="Masukkan password lama"
              value={passwordLama}
              onChange={(e) => setPasswordLama(e.target.value)}
            />
          </FormField>

          <FormField label="Password Baru" error={errors.passwordBaru} required>
            <input
              type="password"
              className="input"
              placeholder="Masukkan password baru (min. 4 karakter)"
              value={passwordBaru}
              onChange={(e) => setPasswordBaru(e.target.value)}
            />
          </FormField>

          <FormField label="Konfirmasi Password Baru" error={errors.konfirmasiPassword} required>
            <input
              type="password"
              className="input"
              placeholder="Masukkan ulang password baru"
              value={konfirmasiPassword}
              onChange={(e) => setKonfirmasiPassword(e.target.value)}
            />
          </FormField>

          <div className="flex gap-3 pt-2">
            <Button type="submit" loading={loading}>
              Simpan Perubahan
            </Button>
            <Button type="button" variant="outline" onClick={() => navigate(-1)}>
              Batal
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
