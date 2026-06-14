import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './contexts/AuthContext'
import Login from './pages/auth/Login'
import SiswaQR from './pages/siswa/QRScanner'
import AdminLayout from './components/layout/AdminLayout'
import GuruLayout from './components/layout/GuruLayout'
import AdminDashboard from './pages/admin/Dashboard'
import GuruDashboard from './pages/guru/Dashboard'
import DataSiswa from './pages/admin/DataSiswa'
import DataKelas from './pages/admin/DataKelas'
import DataUser from './pages/admin/DataUser'
import GenerateQR from './pages/admin/GenerateQR'
import LaporanPresensi from './pages/LaporanPresensi'
import PengaturanJam from './pages/admin/PengaturanJam'
import AuditLog from './pages/admin/AuditLog'
import Profil from './pages/Profil'
import PresensiManual from './pages/guru/PresensiManual'
import PresensiQRScanner from './pages/PresensiQRScanner'
import LoadingSpinner from './components/ui/LoadingSpinner'

function ProtectedRoute({ children, role }: { children: React.ReactNode; role?: string }) {
  const { user, isLoading } = useAuth()

  if (isLoading) return <LoadingSpinner />
  if (!user) return <Navigate to="/login" replace />
  if (role && user.role !== role) {
    return <Navigate to={user.role === 'ADMIN' ? '/admin/dashboard' : '/guru/dashboard'} replace />
  }
  return <>{children}</>
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth()

  if (isLoading) return <LoadingSpinner />
  if (user) {
    return <Navigate to={user.role === 'ADMIN' ? '/admin/dashboard' : '/guru/dashboard'} replace />
  }
  return <>{children}</>
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/siswa/qr" element={<SiswaQR />} />

      <Route path="/admin" element={<ProtectedRoute role="ADMIN"><AdminLayout /></ProtectedRoute>}>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="siswa" element={<DataSiswa />} />
        <Route path="kelas" element={<DataKelas />} />
        <Route path="users" element={<DataUser />} />
        <Route path="generate-qr" element={<GenerateQR />} />
        <Route path="presensi-qr" element={<PresensiQRScanner />} />
        <Route path="laporan" element={<LaporanPresensi />} />
        <Route path="pengaturan-jam" element={<PengaturanJam />} />
        <Route path="audit-log" element={<AuditLog />} />
        <Route path="profil" element={<Profil />} />
      </Route>

      <Route path="/guru" element={<ProtectedRoute role="GURU"><GuruLayout /></ProtectedRoute>}>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<GuruDashboard />} />
        <Route path="siswa" element={<DataSiswa />} />
        <Route path="presensi-manual" element={<PresensiManual />} />
        <Route path="presensi-qr" element={<PresensiQRScanner />} />
        <Route path="laporan" element={<LaporanPresensi />} />
        <Route path="profil" element={<Profil />} />
      </Route>

      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}