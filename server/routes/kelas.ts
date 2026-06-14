import { Router, Response } from 'express'
import { authenticate, authorize, AuthRequest } from '../middleware/auth'
import prisma from '../lib/prisma'
import { createKelasSchema, updateKelasSchema } from '../lib/validation'
import { catatAudit } from '../lib/audit'

const router = Router()
router.use(authenticate)
router.use(authorize('ADMIN'))

router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const kelas = await prisma.kelas.findMany({
      include: {
        _count: { select: { siswa: true } },
        waliKelas: { select: { id: true, nama: true, username: true } },
        tahunAjaran: { select: { id: true, tahun: true, semester: true } },
      },
      orderBy: [{ tahunAjaranId: 'asc' }, { nama: 'asc' }],
    })
    res.json({ success: true, data: kelas })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Gagal memuat data kelas' })
  }
})

router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const kelas = await prisma.kelas.findUnique({
      where: { id: req.params.id },
      include: {
        _count: { select: { siswa: true } },
        waliKelas: { select: { id: true, nama: true, username: true } },
        tahunAjaran: { select: { id: true, tahun: true, semester: true } },
      },
    })
    if (!kelas) {
      return res.status(404).json({ success: false, error: 'Kelas tidak ditemukan' })
    }
    res.json({ success: true, data: kelas })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Gagal memuat data kelas' })
  }
})

router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const parsed = createKelasSchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({ success: false, error: parsed.error.issues[0].message })
    }

    const { nama, waliKelasId, tahunAjaranId } = parsed.data

    // Cek duplikasi nama kelas dalam tahun ajaran yang sama
    const existing = await prisma.kelas.findFirst({
      where: { nama, tahunAjaranId: tahunAjaranId || null },
    })
    if (existing) {
      return res.status(400).json({ success: false, error: 'Kelas dengan nama ini sudah ada' })
    }

    const kelas = await prisma.kelas.create({
      data: {
        nama,
        waliKelasId: waliKelasId || null,
        tahunAjaranId: tahunAjaranId || null,
      },
      include: { waliKelas: { select: { nama: true } } },
    })

    await catatAudit({
      aksi: 'CREATE_KELAS',
      userId: req.user?.id,
      deskripsi: `Membuat kelas ${kelas.nama}`,
      detail: { kelasId: kelas.id, nama: kelas.nama },
      req: req as any,
    })

    res.status(201).json({ success: true, data: kelas, message: 'Kelas berhasil ditambahkan' })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Gagal menambah kelas' })
  }
})

router.put('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const parsed = updateKelasSchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({ success: false, error: parsed.error.issues[0].message })
    }

    const { nama, waliKelasId, tahunAjaranId } = parsed.data

    // Cek duplikasi nama kelas (kecuali dirinya sendiri)
    const existing = await prisma.kelas.findFirst({
      where: {
        nama,
        tahunAjaranId: tahunAjaranId || null,
        id: { not: req.params.id },
      },
    })
    if (existing) {
      return res.status(400).json({ success: false, error: 'Kelas dengan nama ini sudah ada' })
    }

    const kelas = await prisma.kelas.update({
      where: { id: req.params.id },
      data: {
        nama,
        waliKelasId: waliKelasId || null,
        tahunAjaranId: tahunAjaranId || null,
      },
      include: { waliKelas: { select: { nama: true } } },
    })

    await catatAudit({
      aksi: 'UPDATE_KELAS',
      userId: req.user?.id,
      deskripsi: `Mengubah kelas ${kelas.nama}`,
      detail: { kelasId: kelas.id },
      req: req as any,
    })

    res.json({ success: true, data: kelas, message: 'Kelas berhasil diubah' })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Gagal mengubah kelas' })
  }
})

router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const kelas = await prisma.kelas.findUnique({ where: { id: req.params.id } })
    if (!kelas) {
      return res.status(404).json({ success: false, error: 'Kelas tidak ditemukan' })
    }

    const siswaCount = await prisma.siswa.count({ where: { kelasId: req.params.id } })
    if (siswaCount > 0) {
      return res.status(400).json({
        success: false,
        error: `Kelas masih memiliki ${siswaCount} siswa. Pindahkan atau hapus siswa terlebih dahulu`,
      })
    }

    await prisma.kelas.delete({ where: { id: req.params.id } })

    await catatAudit({
      aksi: 'DELETE_KELAS',
      userId: req.user?.id,
      deskripsi: `Menghapus kelas ${kelas.nama}`,
      detail: { kelasId: req.params.id },
      req: req as any,
    })

    res.json({ success: true, message: 'Kelas berhasil dihapus' })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Gagal menghapus kelas' })
  }
})

export default router
