import { useState, useEffect } from 'react'
import { api } from '@/lib/api'
import { useToast } from '@/contexts/ToastContext'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import FormField from '@/components/ui/FormField'
import Badge from '@/components/ui/Badge'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import EmptyState from '@/components/ui/EmptyState'
import { TableSkeleton } from '@/components/ui/Skeleton'
import { Plus, Edit2, Trash2, Shield, ShieldCheck } from 'lucide-react'
import { ROLE_LABELS } from '@/types'

export default function DataUser() {
  const { error: toastError, success: toastSuccess } = useToast()
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editItem, setEditItem] = useState<any>(null)
  const [form, setForm] = useState({ username: '', password: '', nama: '', role: 'GURU' })
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<any>(null)
  const [deleting, setDeleting] = useState(false)

  const loadData = async () => {
    try {
      const data = await api.users.list()
      setUsers(data)
    } catch (e: any) {
      toastError('Gagal memuat data', e.message)
    }
    setLoading(false)
  }

  useEffect(() => { loadData() }, [])

  const openAdd = () => {
    setEditItem(null)
    setForm({ username: '', password: '', nama: '', role: 'GURU' })
    setFormErrors({})
    setModalOpen(true)
  }

  const openEdit = (u: any) => {
    setEditItem(u)
    setForm({ username: u.username, password: '', nama: u.nama, role: u.role })
    setFormErrors({})
    setModalOpen(true)
  }

  const validate = () => {
    const errors: Record<string, string> = {}
    if (!form.username.trim()) errors.username = 'Username harus diisi'
    if (!form.nama.trim()) errors.nama = 'Nama harus diisi'
    if (!editItem && !form.password) errors.password = 'Password harus diisi'
    if (form.password && form.password.length < 4) errors.password = 'Password minimal 4 karakter'
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSave = async () => {
    if (!validate()) return
    setSaving(true)
    try {
      if (editItem) {
        const data: any = { username: form.username, nama: form.nama, role: form.role }
        if (form.password) data.password = form.password
        await api.users.update(editItem.id, data)
        toastSuccess('Pengguna diubah', `Data ${form.nama} berhasil diperbarui`)
      } else {
        await api.users.create(form)
        toastSuccess('Pengguna ditambahkan', `${form.nama} berhasil didaftarkan`)
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
      await api.users.delete(deleteTarget.id)
      toastSuccess('Pengguna dihapus', `Akun ${deleteTarget.nama} berhasil dihapus`)
      setDeleteTarget(null)
      loadData()
    } catch (e: any) {
      toastError('Gagal menghapus', e.message)
    }
    setDeleting(false)
  }

  if (loading) return <TableSkeleton rows={5} cols={6} />

  return (
    <div className="space-y-5">
      <div className="page-header">
        <div>
          <h1 className="page-title">Data Pengguna</h1>
          <p className="page-desc">{users.length} pengguna terdaftar</p>
        </div>
        <Button onClick={openAdd}>
          <Plus className="w-4 h-4" />
          Tambah Pengguna
        </Button>
      </div>

      <div className="card p-0">
        {users.length === 0 ? (
          <EmptyState icon={<Shield className="w-6 h-6" />} title="Belum ada pengguna" description="Tambahkan admin atau guru" />
        ) : (
          <div className="table-container border-0 rounded-none">
            <table className="table">
              <thead>
                <tr>
                  <th className="w-12">No</th>
                  <th>Username</th>
                  <th>Nama</th>
                  <th>Role</th>
                  <th>Tanggal Daftar</th>
                  <th className="w-24 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u, i) => (
                  <tr key={u.id}>
                    <td className="text-text-muted text-center">{i + 1}</td>
                    <td className="font-mono text-xs font-medium">{u.username}</td>
                    <td className="font-semibold">{u.nama}</td>
                    <td>
                      <Badge variant={u.role === 'ADMIN' ? 'info' : 'success'}>
                        {ROLE_LABELS[u.role as keyof typeof ROLE_LABELS]}
                      </Badge>
                    </td>
                    <td className="text-sm text-text-secondary">{new Date(u.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                    <td>
                      <div className="flex items-center justify-center gap-1">
                        <button onClick={() => openEdit(u)} className="action-icon" aria-label={`Ubah ${u.nama}`}>
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => setDeleteTarget(u)} className="action-icon-danger" aria-label={`Hapus ${u.nama}`}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editItem ? 'Ubah Pengguna' : 'Tambah Pengguna'}>
        <div className="space-y-4">
          <FormField label="Username" required error={formErrors.username}>
            <input className={`input ${formErrors.username ? 'input-error' : ''}`} value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })} placeholder="Masukkan username" autoComplete="off" />
          </FormField>
          <FormField label="Nama Lengkap" required error={formErrors.nama}>
            <input className={`input ${formErrors.nama ? 'input-error' : ''}`} value={form.nama}
              onChange={(e) => setForm({ ...form, nama: e.target.value })} placeholder="Masukkan nama lengkap" />
          </FormField>
          <FormField label={editItem ? 'Password (biarkan kosong jika tidak diubah)' : 'Password'} required={!editItem} error={formErrors.password}>
            <input className={`input ${formErrors.password ? 'input-error' : ''}`} type="password" value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder={editItem ? 'Kosongkan jika tidak diubah' : 'Min. 4 karakter'} autoComplete="off" />
          </FormField>
          {!editItem && (
            <FormField label="Role">
              <div className="flex gap-2">
                <Button
                  onClick={() => setForm({ ...form, role: 'GURU' })}
                  variant={form.role === 'GURU' ? 'primary' : 'secondary'}
                  size="sm"
                  fullWidth
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Guru
                </Button>
                <Button
                  onClick={() => setForm({ ...form, role: 'ADMIN' })}
                  variant={form.role === 'ADMIN' ? 'primary' : 'secondary'}
                  size="sm"
                  fullWidth
                >
                  <Shield className="w-3.5 h-3.5" />
                  Admin
                </Button>
              </div>
            </FormField>
          )}
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
        title="Hapus Pengguna"
        message={<>Yakin ingin menghapus akun <strong>{deleteTarget?.nama}</strong>? Tindakan ini tidak dapat dibatalkan.</>}
        confirmLabel="Ya, Hapus"
        variant="danger"
        loading={deleting}
      />
    </div>
  )
}
