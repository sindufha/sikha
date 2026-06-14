import { Router, Response } from 'express'
import { authenticate, AuthRequest } from '../middleware/auth'
import prisma from '../lib/prisma'
import { createSiswaSchema, updateSiswaSchema } from '../lib/validation'
import { catatAudit } from '../lib/audit'

const router = Router()
router.use(authenticate)

router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const { kelas, search, page, limit } = req.query
    const where: any = {}

    if (kelas) where.kelasId = kelas as string
    if (search) {
      where.OR = [
        { nama: { contains: search as string, mode: 'insensitive' } },
        { nis: { contains: search as string, mode: 'insensitive' } },
      ]
    }

    // Filter berdasarkan role
    if (req.user?.role === 'GURU') {
      const kelasGuru = await prisma.kelas.findMany({
        where: { waliKelasId: req.user.id },
        select: { id: true },
      })
      const kelasIds = kelasGuru.map((k) => k.id)
      if (kelas) {
        // Jika sudah filter kelas, pastikan kelas tersebut adalah kelas guru
        if (!kelasIds.includes(kelas as string)) {
          return res.json({ success: true, data: [], pagination: { page: 1, limit: 0, total: 0, totalPages: 0 } })
        }
      } else {
        where.kelasId = { in: kelasIds }
      }
    }

    const pageNum = Math.max(1, parseInt((page as string) || '1'))
    const limitNum = Math.min(100, Math.max(1, parseInt((limit as string) || '50')))

    const [siswa, total] = await Promise.all([
      prisma.siswa.findMany({
        where,
        include: { kelas: true },
        orderBy: [{ kelasId: 'asc' }, { nama: 'asc' }],
        skip: (pageNum - 1) * limitNum,
        take: limitNum,
      }),
      prisma.siswa.count({ where }),
    ])

    res.json({
      success: true,
      data: siswa,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Gagal memuat data siswa' })
  }
})

router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const siswa = await prisma.siswa.findUnique({
      where: { id: req.params.id },
      include: { kelas: true },
    })
    if (!siswa) {
      return res.status(404).json({ success: false, error: 'Siswa tidak ditemukan' })
    }
    res.json({ success: true, data: siswa })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Gagal memuat data siswa' })
  }
})

router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const parsed = createSiswaSchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({ success: false, error: parsed.error.issues[0].message })
    }

    const { nis, nisn, nama, jenisKelamin, tempatLahir, tanggalLahir, alamat, namaAyah, namaIbu, noTelpOrtu, tahunMasuk, kelasId } = parsed.data

    const existing = await prisma.siswa.findUnique({ where: { nis } })
    if (existing) {
      return res.status(400).json({ success: false, error: 'NIS sudah terdaftar' })
    }

    const kelas = await prisma.kelas.findUnique({ where: { id: kelasId } })
    if (!kelas) {
      return res.status(400).json({ success: false, error: 'Kelas tidak ditemukan' })
    }

    const parsedTanggalLahir = tanggalLahir ? new Date(tanggalLahir) : undefined

    const siswa = await prisma.siswa.create({
      data: {
        nis,
        nisn: nisn || null,
        nama,
        jenisKelamin: jenisKelamin as any || null,
        tempatLahir: tempatLahir || null,
        tanggalLahir: parsedTanggalLahir || null,
        alamat: alamat || null,
        namaAyah: namaAyah || null,
        namaIbu: namaIbu || null,
        noTelpOrtu: noTelpOrtu || null,
        tahunMasuk: tahunMasuk || null,
        kelasId,
      },
      include: { kelas: true },
    })

    await catatAudit({
      aksi: 'CREATE_SISWA',
      userId: req.user?.id,
      deskripsi: `Menambah siswa ${siswa.nama} (${siswa.nis})`,
      detail: { siswaId: siswa.id, nis: siswa.nis, nama: siswa.nama },
      req: req as any,
    })

    res.status(201).json({ success: true, data: siswa, message: 'Siswa berhasil ditambahkan' })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Gagal menambah siswa' })
  }
})

router.put('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const parsed = updateSiswaSchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({ success: false, error: parsed.error.issues[0].message })
    }

    const { nis, nisn, nama, jenisKelamin, tempatLahir, tanggalLahir, alamat, namaAyah, namaIbu, noTelpOrtu, tahunMasuk, kelasId } = parsed.data

    const siswaLama = await prisma.siswa.findUnique({ where: { id: req.params.id } })
    if (!siswaLama) {
      return res.status(404).json({ success: false, error: 'Siswa tidak ditemukan' })
    }

    const kelas = await prisma.kelas.findUnique({ where: { id: kelasId } })
    if (!kelas) {
      return res.status(400).json({ success: false, error: 'Kelas tidak ditemukan' })
    }

    const existing = await prisma.siswa.findUnique({ where: { nis } })
    if (existing && existing.id !== req.params.id) {
      return res.status(400).json({ success: false, error: 'NIS sudah digunakan siswa lain' })
    }

    const parsedTanggalLahir = tanggalLahir ? new Date(tanggalLahir) : undefined

    const siswa = await prisma.siswa.update({
      where: { id: req.params.id },
      data: {
        nis,
        nisn: nisn || null,
        nama,
        jenisKelamin: jenisKelamin as any || null,
        tempatLahir: tempatLahir || null,
        tanggalLahir: parsedTanggalLahir || null,
        alamat: alamat || null,
        namaAyah: namaAyah || null,
        namaIbu: namaIbu || null,
        noTelpOrtu: noTelpOrtu || null,
        tahunMasuk: tahunMasuk || null,
        kelasId,
      },
      include: { kelas: true },
    })

    await catatAudit({
      aksi: 'UPDATE_SISWA',
      userId: req.user?.id,
      deskripsi: `Mengubah data siswa ${siswa.nama} (${siswa.nis})`,
      detail: { siswaId: siswa.id },
      req: req as any,
    })

    res.json({ success: true, data: siswa, message: 'Data siswa berhasil diubah' })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Gagal mengubah data siswa' })
  }
})

router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const siswa = await prisma.siswa.findUnique({ where: { id: req.params.id } })
    if (!siswa) {
      return res.status(404).json({ success: false, error: 'Siswa tidak ditemukan' })
    }

    await prisma.siswa.delete({ where: { id: req.params.id } })

    await catatAudit({
      aksi: 'DELETE_SISWA',
      userId: req.user?.id,
      deskripsi: `Menghapus siswa ${siswa.nama} (${siswa.nis})`,
      detail: { siswaId: req.params.id },
      req: req as any,
    })

    res.json({ success: true, message: 'Siswa berhasil dihapus' })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Gagal menghapus siswa' })
  }
})

export default router
