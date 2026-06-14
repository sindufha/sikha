import { useState, useEffect } from 'react'
import { api } from '@/lib/api'
import { useToast } from '@/contexts/ToastContext'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import FormField from '@/components/ui/FormField'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import EmptyState from '@/components/ui/EmptyState'
import { TableSkeleton } from '@/components/ui/Skeleton'
import { Plus, Edit2, Trash2, GraduationCap, Users } from 'lucide-react'

export default function DataKelas() {
  const { error: toastError, success: toastSuccess } = useToast()
  const [kelas, setKelas] = useState<any[]>([])
  const [guru, setGuru] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editItem, setEditItem] = useState<any>(null)
  const [form, setForm] = useState({ nama: '', waliKelasId: '' })
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<any>(null)
  const [deleting, setDeleting] = useState(false)

  const loadData = async () => {
    try {
      const [kelasData, guruData] = await Promise.all([
        api.kelas.list(),
        api.users.list(),
      ])
      setKelas(kelasData)
      setGuru(guruData.filter((u: any) => u.role === 'GURU'))
    } catch (e: any) {
      toastError('Gagal memuat data', e.message)
    }
    setLoading(false)
  }

  useEffect(() => { loadData() }, [])

  const openAdd = () => {
    setEditItem(null)
    setForm({ nama: '', waliKelasId: '' })
    setFormErrors({})
    setModalOpen(true)
  }

  const openEdit = (k: any) => {
    setEditItem(k)
    setForm({ nama: k.nama, waliKelasId: k.waliKelasId || '' })
    setFormErrors({})
    setModalOpen(true)
  }

  const validate = () => {
    const errors: Record<string, string> = {}
    if (!form.nama.trim()) errors.nama = 'Nama kelas harus diisi'
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSave = async () => {
    if (!validate()) return
    setSaving(true)
    try {
      if (editItem) {
        await api.kelas.update(editItem.id, form)
        toastSuccess('Kelas diubah', `Kelas ${form.nama} berhasil diperbarui`)
      } else {
        await api.kelas.create(form)
        toastSuccess('Kelas ditambahkan', `Kelas ${form.nama} berhasil dibuat`)
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
      await api.kelas.delete(deleteTarget.id)
      toastSuccess('Kelas dihapus', `Kelas ${deleteTarget.nama} berhasil dihapus`)
      setDeleteTarget(null)
      loadData()
    } catch (e: any) {
      toastError('Gagal menghapus', e.message)
    }
    setDeleting(false)
  }

  if (loading) return <TableSkeleton rows={4} cols={3} />

  return (
    <div className="space-y-5">
      <div className="page-header">
        <div>
          <h1 className="page-title">Data Kelas</h1>
          <p className="page-desc">{kelas.length} kelas terdaftar</p>
        </div>
        <Button onClick={openAdd}>
          <Plus className="w-4 h-4" />
          Tambah Kelas
        </Button>
      </div>

      {kelas.length === 0 ? (
        <EmptyState
          icon={<GraduationCap className="w-6 h-6" />}
          title="Belum ada kelas"
          description="Tambahkan kelas untuk memulai"
          action={<Button size="sm" onClick={openAdd}><Plus className="w-3.5 h-3.5" />Tambah Kelas</Button>}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {kelas.map((k: any, i: number) => (
            <div key={k.id} className="card animate-in" style={{ animationDelay: `${i * 50}ms` }}>
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-primary-50 flex items-center justify-center">
                    <GraduationCap className="w-4.5 h-4.5 text-primary-dark" />
                  </div>
                  <h3 className="font-bold text-sm">Kelas {k.nama}</h3>
                </div>
                <div className="flex gap-0.5">
                  <button onClick={() => openEdit(k)} className="action-icon" aria-label={`Ubah kelas ${k.nama}`}>
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => setDeleteTarget(k)} className="action-icon-danger" aria-label={`Hapus kelas ${k.nama}`}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              <div className="space-y-1 text-xs text-text-secondary">
                <div className="flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5" />
                  <span>{k._count?.siswa || 0} siswa</span>
                </div>
                <p>
                  Wali Kelas:{' '}
                  {k.waliKelas?.nama || <span className="italic text-text-muted">Belum ditentukan</span>}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editItem ? 'Ubah Kelas' : 'Tambah Kelas'}>
        <div className="space-y-4">
          <FormField label="Nama Kelas" required error={formErrors.nama}>
            <input className={`input ${formErrors.nama ? 'input-error' : ''}`} value={form.nama}
              onChange={(e) => setForm({ ...form, nama: e.target.value })} placeholder="Contoh: 1A, 2B, 3C" />
          </FormField>
          <FormField label="Wali Kelas" helperText="Opsional — pilih guru yang menjadi wali kelas">
            <select className="select" value={form.waliKelasId} onChange={(e) => setForm({ ...form, waliKelasId: e.target.value })}>
              <option value="">Tidak Ada</option>
              {guru.map((g: any) => (
                <option key={g.id} value={g.id}>{g.nama}</option>
              ))}
            </select>
          </FormField>
          <div className="modal-footer">
            <Button onClick={() => setModalOpen(false)} variant="ghost" disabled={saving}>Batal</Button>
            <Button onClick={handleSave} loading={saving}>Simpan</Button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Hapus Kelas"
        message={<>Yakin ingin menghapus kelas <strong>{deleteTarget?.nama}</strong>? Semua siswa di kelas ini akan terpengaruh.</>}
        confirmLabel="Ya, Hapus"
        variant="danger"
        loading={deleting}
      />
    </div>
  )
}
