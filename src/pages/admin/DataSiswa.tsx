import { useState, useEffect, useCallback } from 'react'
import { api } from '@/lib/api'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/contexts/ToastContext'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import FormField from '@/components/ui/FormField'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import EmptyState from '@/components/ui/EmptyState'
import { TableSkeleton } from '@/components/ui/Skeleton'
import { Plus, Search, Edit2, Trash2, Users, User, Calendar, MapPin, Phone } from 'lucide-react'

export default function DataSiswa() {
  const { user } = useAuth()
  const { error: toastError, success: toastSuccess } = useToast()
  const isAdmin = user?.role === 'ADMIN'
  const [siswa, setSiswa] = useState<any[]>([])
  const [kelas, setKelas] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [kelasFilter, setKelasFilter] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editItem, setEditItem] = useState<any>(null)
  const [form, setForm] = useState({
    nis: '', nisn: '', nama: '', jenisKelamin: '',
    tempatLahir: '', tanggalLahir: '', alamat: '',
    namaAyah: '', namaIbu: '', noTelpOrtu: '',
    tahunMasuk: '', kelasId: '',
  })
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<any>(null)
  const [deleting, setDeleting] = useState(false)

  const loadData = useCallback(async () => {
    try {
      const [siswaData, kelasData] = await Promise.all([
        api.siswa.list({ search, kelas: kelasFilter }),
        api.kelas.list(),
      ])
      setSiswa(siswaData)
      setKelas(kelasData)
    } catch (e: any) {
      toastError('Gagal memuat data', e.message)
    }
    setLoading(false)
  }, [search, kelasFilter, toastError])

  useEffect(() => { loadData() }, [loadData])

  const openAdd = () => {
    setEditItem(null)
    setForm({
      nis: '', nisn: '', nama: '', jenisKelamin: '',
      tempatLahir: '', tanggalLahir: '', alamat: '',
      namaAyah: '', namaIbu: '', noTelpOrtu: '',
      tahunMasuk: '', kelasId: kelas[0]?.id || '',
    })
    setFormErrors({})
    setModalOpen(true)
  }

  const openEdit = (s: any) => {
    setEditItem(s)
    setForm({
      nis: s.nis || '',
      nisn: s.nisn || '',
      nama: s.nama || '',
      jenisKelamin: s.jenisKelamin || '',
      tempatLahir: s.tempatLahir || '',
      tanggalLahir: s.tanggalLahir || '',
      alamat: s.alamat || '',
      namaAyah: s.namaAyah || '',
      namaIbu: s.namaIbu || '',
      noTelpOrtu: s.noTelpOrtu || '',
      tahunMasuk: s.tahunMasuk ? String(s.tahunMasuk) : '',
      kelasId: s.kelasId || '',
    })
    setFormErrors({})
    setModalOpen(true)
  }

  const validate = () => {
    const errors: Record<string, string> = {}
    if (!form.nis.trim()) errors.nis = 'NIS harus diisi'
    if (!form.nama.trim()) errors.nama = 'Nama harus diisi'
    if (!form.kelasId) errors.kelasId = 'Pilih kelas'
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSave = async () => {
    if (!validate()) return
    setSaving(true)
    try {
      // Build payload — remove empty optional fields so the server doesn't reject them
      const payload: any = { ...form }
      if (!payload.tahunMasuk) delete payload.tahunMasuk
      if (!payload.nisn) delete payload.nisn
      if (!payload.jenisKelamin) delete payload.jenisKelamin
      if (!payload.tempatLahir) delete payload.tempatLahir
      if (!payload.tanggalLahir) delete payload.tanggalLahir
      if (!payload.alamat) delete payload.alamat
      if (!payload.namaAyah) delete payload.namaAyah
      if (!payload.namaIbu) delete payload.namaIbu
      if (!payload.noTelpOrtu) delete payload.noTelpOrtu

      if (editItem) {
        await api.siswa.update(editItem.id, payload)
        toastSuccess('Siswa diubah', `Data ${form.nama} berhasil diperbarui`)
      } else {
        await api.siswa.create(payload)
        toastSuccess('Siswa ditambahkan', `${form.nama} berhasil didaftarkan`)
      }
      setModalOpen(false)
      loadData()
    } catch (e: any) {
      toastError('Gagal menyimpan', e.message)
    }
    setSaving(false)
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await api.siswa.delete(deleteTarget.id)
      toastSuccess('Siswa dihapus', `Data ${deleteTarget.nama} berhasil dihapus`)
      setDeleteTarget(null)
      loadData()
    } catch (e: any) {
      toastError('Gagal menghapus', e.message)
    }
    setDeleting(false)
  }

  if (loading) return <TableSkeleton rows={6} cols={5} />

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Data Siswa</h1>
          <p className="page-desc">{siswa.length} siswa terdaftar</p>
        </div>
        {isAdmin && (
          <Button onClick={openAdd}>
            <Plus className="w-4 h-4" />
            Tambah Siswa
          </Button>
        )}
      </div>

      {/* Toolbar */}
      <div className="toolbar-row">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <input
            type="text"
            className="input pl-9"
            placeholder="Cari nama atau NIS..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select className="select max-w-[180px]" value={kelasFilter} onChange={(e) => setKelasFilter(e.target.value)}>
          <option value="">Semua Kelas</option>
          {kelas.map((k: any) => (
            <option key={k.id} value={k.id}>Kelas {k.nama}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="card p-0">
        {siswa.length === 0 ? (
          <EmptyState
            icon={<Users className="w-6 h-6" />}
            title="Tidak ada data siswa"
            description={search || kelasFilter ? 'Coba ubah filter pencarian' : 'Belum ada siswa yang terdaftar'}
            action={isAdmin && !search && !kelasFilter ? <Button size="sm" onClick={openAdd}><Plus className="w-3.5 h-3.5" />Tambah Siswa</Button> : undefined}
          />
        ) : (
          <div className="table-container border-0 rounded-none">
            <table className="table">
              <thead>
                <tr>
                  <th className="w-12">No</th>
                  <th>NIS</th>
                  <th>Nama</th>
                  <th>Kelas</th>
                  {isAdmin && <th className="w-24 text-center">Aksi</th>}
                </tr>
              </thead>
              <tbody>
                {siswa.map((s, i) => (
                  <tr key={s.id} className="animate-in" style={{ animationDelay: `${Math.min(i * 30, 300)}ms` }}>
                    <td className="text-text-muted text-center">{i + 1}</td>
                    <td className="font-mono text-xs font-medium">{s.nis}</td>
                    <td className="font-semibold">{s.nama}</td>
                    <td className="text-text-secondary">{s.kelas?.nama}</td>
                    {isAdmin && (
                      <td>
                        <div className="flex items-center justify-center gap-1">
                          <button onClick={() => openEdit(s)} className="action-icon" aria-label={`Ubah ${s.nama}`}>
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => setDeleteTarget(s)} className="action-icon-danger" aria-label={`Hapus ${s.nama}`}>
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Form Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editItem ? 'Ubah Siswa' : 'Tambah Siswa'}>
        <div className="space-y-5">
          {/* ── Data Identitas ── */}
          <div>
            <div className="border-b border-border pb-2 mb-4">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-text-muted flex items-center gap-1.5">
                <User className="w-3.5 h-3.5" />
                Data Identitas
              </h4>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <FormField label="NIS" required error={formErrors.nis}>
                <input className={`input ${formErrors.nis ? 'input-error' : ''}`} value={form.nis} onChange={(e) => setForm({ ...form, nis: e.target.value })} placeholder="Masukkan NIS" />
              </FormField>
              <FormField label="NISN" error={formErrors.nisn}>
                <input className={`input ${formErrors.nisn ? 'input-error' : ''}`} value={form.nisn} onChange={(e) => setForm({ ...form, nisn: e.target.value })} placeholder="Masukkan NISN (opsional)" />
              </FormField>
            </div>
          </div>

          {/* ── Data Pribadi ── */}
          <div>
            <div className="border-b border-border pb-2 mb-4">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-text-muted flex items-center gap-1.5">
                <User className="w-3.5 h-3.5" />
                Data Pribadi
              </h4>
            </div>
            <div className="space-y-3">
              <FormField label="Nama Lengkap" required error={formErrors.nama}>
                <input className={`input ${formErrors.nama ? 'input-error' : ''}`} value={form.nama} onChange={(e) => setForm({ ...form, nama: e.target.value })} placeholder="Masukkan nama lengkap" />
              </FormField>
              <FormField label="Jenis Kelamin">
                <div className="flex gap-2">
                  <Button
                    onClick={() => setForm({ ...form, jenisKelamin: 'LAKI_LAKI' })}
                    variant={form.jenisKelamin === 'LAKI_LAKI' ? 'primary' : 'secondary'}
                    size="sm"
                    fullWidth
                  >
                    Laki-laki
                  </Button>
                  <Button
                    onClick={() => setForm({ ...form, jenisKelamin: 'PEREMPUAN' })}
                    variant={form.jenisKelamin === 'PEREMPUAN' ? 'primary' : 'secondary'}
                    size="sm"
                    fullWidth
                  >
                    Perempuan
                  </Button>
                </div>
              </FormField>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <FormField label="Tempat Lahir" error={formErrors.tempatLahir}>
                  <input className={`input ${formErrors.tempatLahir ? 'input-error' : ''}`} value={form.tempatLahir} onChange={(e) => setForm({ ...form, tempatLahir: e.target.value })} placeholder="Masukkan tempat lahir" />
                </FormField>
                <FormField label="Tanggal Lahir" error={formErrors.tanggalLahir}>
                  <div className="relative">
                    <input type="date" className={`input ${formErrors.tanggalLahir ? 'input-error' : ''}`} value={form.tanggalLahir} onChange={(e) => setForm({ ...form, tanggalLahir: e.target.value })} />
                    <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
                  </div>
                </FormField>
              </div>
            </div>
          </div>

          {/* ── Alamat ── */}
          <div>
            <div className="border-b border-border pb-2 mb-4">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-text-muted flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5" />
                Alamat
              </h4>
            </div>
            <FormField label="Alamat" error={formErrors.alamat}>
              <textarea className={`input min-h-[80px] resize-y py-2.5 ${formErrors.alamat ? 'input-error' : ''}`} value={form.alamat} onChange={(e) => setForm({ ...form, alamat: e.target.value })} placeholder="Masukkan alamat lengkap (opsional)" />
            </FormField>
          </div>

          {/* ── Data Orang Tua ── */}
          <div>
            <div className="border-b border-border pb-2 mb-4">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-text-muted flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5" />
                Data Orang Tua
              </h4>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <FormField label="Nama Ayah" error={formErrors.namaAyah}>
                <input className={`input ${formErrors.namaAyah ? 'input-error' : ''}`} value={form.namaAyah} onChange={(e) => setForm({ ...form, namaAyah: e.target.value })} placeholder="Nama ayah (opsional)" />
              </FormField>
              <FormField label="Nama Ibu" error={formErrors.namaIbu}>
                <input className={`input ${formErrors.namaIbu ? 'input-error' : ''}`} value={form.namaIbu} onChange={(e) => setForm({ ...form, namaIbu: e.target.value })} placeholder="Nama ibu (opsional)" />
              </FormField>
            </div>
            <div className="mt-3">
              <FormField label="No. Telepon Orang Tua" error={formErrors.noTelpOrtu}>
                <input className={`input ${formErrors.noTelpOrtu ? 'input-error' : ''}`} value={form.noTelpOrtu} onChange={(e) => setForm({ ...form, noTelpOrtu: e.target.value })} placeholder="Contoh: 0812xxxxxxxx (opsional)" />
              </FormField>
            </div>
          </div>

          {/* ── Data Akademik ── */}
          <div>
            <div className="border-b border-border pb-2 mb-4">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-text-muted flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                Data Akademik
              </h4>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <FormField label="Tahun Masuk" error={formErrors.tahunMasuk}>
                <input type="number" className={`input ${formErrors.tahunMasuk ? 'input-error' : ''}`} value={form.tahunMasuk} onChange={(e) => setForm({ ...form, tahunMasuk: e.target.value })} placeholder="Contoh: 2024" min={1900} max={2100} />
              </FormField>
              <FormField label="Kelas" required error={formErrors.kelasId}>
                <select className={`select ${formErrors.kelasId ? 'input-error' : ''}`} value={form.kelasId} onChange={(e) => setForm({ ...form, kelasId: e.target.value })}>
                  <option value="">Pilih kelas</option>
                  {kelas.map((k: any) => (
                    <option key={k.id} value={k.id}>Kelas {k.nama}</option>
                  ))}
                </select>
              </FormField>
            </div>
          </div>

          {/* ── Footer ── */}
          <div className="modal-footer !mt-6">
            <Button onClick={() => setModalOpen(false)} variant="ghost" disabled={saving}>Batal</Button>
            <Button onClick={handleSave} loading={saving}>Simpan</Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirm */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Hapus Siswa"
        message={<>Yakin ingin menghapus <strong>{deleteTarget?.nama}</strong>? Tindakan ini tidak dapat dibatalkan.</>}
        confirmLabel="Ya, Hapus"
        variant="danger"
        loading={deleting}
      />
    </div>
  )
}
