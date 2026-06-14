import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { School, Eye, EyeOff, Loader2 } from 'lucide-react'
import Button from '@/components/ui/Button'
import FormField from '@/components/ui/FormField'

export default function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!username.trim() || !password.trim()) {
      setError('Silakan isi username dan password')
      return
    }
    setLoading(true)
    try {
      await login(username, password)
      navigate('/admin/dashboard')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-primary-50 flex flex-col items-center justify-center p-4">
      {/* Decorative bg */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-24 -right-24 w-80 h-80 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 rounded-full bg-secondary/5 blur-3xl" />
      </div>

      <div className="w-full max-w-sm relative">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary-dark shadow-lg shadow-primary/20 flex items-center justify-center mx-auto mb-4">
            <School className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-text">SDI Khadijah Sukorejo</h1>
          <p className="text-sm text-text-secondary mt-1">Sistem Kehadiran Siswa (SIKHA)</p>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-2xl shadow-card border border-border p-6">
          <h2 className="text-base font-bold text-center mb-6">Masuk ke Akun Anda</h2>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-error-bg border border-error/20 text-sm text-error-text font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <FormField label="Username" required>
              <input
                type="text"
                className="input"
                placeholder="Masukkan username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                autoFocus
                autoComplete="username"
              />
            </FormField>

            <FormField label="Password" required>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="input pr-10"
                  placeholder="Masukkan password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-text-muted hover:bg-slate-100 transition-colors"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </FormField>

            <Button type="submit" fullWidth loading={loading}>
              Masuk
            </Button>
          </form>

          <div className="mt-5 pt-4 border-t border-border text-center">
            <a
              href="/siswa/qr"
              className="text-sm font-medium text-primary hover:text-primary-dark transition-colors"
            >
              Siswa? Scan QR Code di sini
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
