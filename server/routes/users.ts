import { Router, Response } from 'express'
import bcrypt from 'bcryptjs'
import { authenticate, authorize, AuthRequest } from '../middleware/auth'
import prisma from '../lib/prisma'
import { createUserSchema, updateUserSchema } from '../lib/validation'
import { catatAudit } from '../lib/audit'

const router = Router()
router.use(authenticate)
router.use(authorize('ADMIN'))

router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        role: true,
        nama: true,
        isActive: true,
        lastLogin: true,
        createdAt: true,
        _count: { select: { kelas: true } },
      },
      orderBy: { createdAt: 'desc' },
    })
    res.json({ success: true, data: users })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Gagal memuat data pengguna' })
  }
})

router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const parsed = createUserSchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({ success: false, error: parsed.error.issues[0].message })
    }

    const { username, password, role, nama } = parsed.data

    const existing = await prisma.user.findUnique({ where: { username } })
    if (existing) {
      return res.status(400).json({ success: false, error: 'Username sudah digunakan' })
    }

    const hashedPassword = await bcrypt.hash(password, 12)
    const user = await prisma.user.create({
      data: { username, password: hashedPassword, role, nama },
      select: { id: true, username: true, role: true, nama: true, createdAt: true },
    })

    await catatAudit({
      aksi: 'CREATE_USER',
      userId: req.user?.id,
      deskripsi: `Membuat user ${role}: ${username}`,
      detail: { userId: user.id, username, role },
      req: req as any,
    })

    res.status(201).json({ success: true, data: user, message: 'Pengguna berhasil ditambahkan' })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Gagal menambah pengguna' })
  }
})

router.put('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const parsed = updateUserSchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({ success: false, error: parsed.error.issues[0].message })
    }

    const { username, password, role, nama } = parsed.data
    const data: any = {}
    if (username) data.username = username
    if (role) data.role = role
    if (nama) data.nama = nama
    if (password) data.password = await bcrypt.hash(password, 12)

    const user = await prisma.user.update({
      where: { id: req.params.id },
      data,
      select: { id: true, username: true, role: true, nama: true, createdAt: true },
    })

    await catatAudit({
      aksi: password ? 'RESET_PASSWORD' : 'UPDATE_USER',
      userId: req.user?.id,
      deskripsi: `Mengubah user ${user.username}`,
      detail: { userId: req.params.id, changes: Object.keys(data) },
      req: req as any,
    })

    res.json({ success: true, data: user, message: 'Pengguna berhasil diubah' })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Gagal mengubah pengguna' })
  }
})

router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const adminCount = await prisma.user.count({ where: { role: 'ADMIN' } })
    const user = await prisma.user.findUnique({ where: { id: req.params.id } })

    if (!user) {
      return res.status(404).json({ success: false, error: 'Pengguna tidak ditemukan' })
    }

    if (user.role === 'ADMIN' && adminCount <= 1) {
      return res.status(400).json({ success: false, error: 'Tidak dapat menghapus admin terakhir' })
    }

    await prisma.kelas.updateMany({
      where: { waliKelasId: req.params.id },
      data: { waliKelasId: null },
    })
    await prisma.user.delete({ where: { id: req.params.id } })

    await catatAudit({
      aksi: 'DELETE_USER',
      userId: req.user?.id,
      deskripsi: `Menghapus user ${user.username} (${user.role})`,
      detail: { userId: req.params.id, username: user.username, role: user.role },
      req: req as any,
    })

    res.json({ success: true, message: 'Pengguna berhasil dihapus' })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Gagal menghapus pengguna' })
  }
})

export default router
