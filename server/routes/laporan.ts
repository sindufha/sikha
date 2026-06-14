import { Router, Response } from 'express'
import { authenticate, AuthRequest } from '../middleware/auth'
import prisma from '../lib/prisma'
import { laporanQuerySchema } from '../lib/validation'

const router = Router()
router.use(authenticate)

function getLocalDayRange(dateString: string) {
  const [year, month, day] = dateString.split('-').map(Number)
  const start = new Date(year, month - 1, day)
  const end = new Date(year, month - 1, day + 1)
  return { start, end }
}

router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const parsed = laporanQuerySchema.safeParse(req.query)
    if (!parsed.success) {
      return res.status(400).json({ success: false, error: 'Parameter filter tidak valid' })
    }

    const { kelasId, tanggalMulai, tanggalSelesai, status, page, limit } = parsed.data
    const where: any = {}
    const pageNum = Math.max(1, parseInt(page || '1'))
    const limitNum = Math.min(100, Math.max(1, parseInt(limit || '50')))

    // Filter tanggal di level database
    if (tanggalMulai && tanggalSelesai) {
      const { start } = getLocalDayRange(tanggalMulai)
      const { end } = getLocalDayRange(tanggalSelesai)
      where.tanggal = {
        gte: start,
        lt: end,
      }
    } else if (tanggalMulai) {
      const { start, end } = getLocalDayRange(tanggalMulai)
      where.tanggal = { gte: start, lt: end }
    }

    if (status) where.status = status

    // Filter kelasId di level database
    if (kelasId && kelasId !== 'semua') {
      where.siswa = { kelasId }
    }

    // Filter guru: hanya lihat kelas yang menjadiwali
    if (req.user?.role === 'GURU') {
      const kelasGuru = await prisma.kelas.findMany({
        where: { waliKelasId: req.user.id },
        select: { id: true },
      })
      const kelasIds = kelasGuru.map(k => k.id)
      where.siswa = {
        ...(where.siswa || {}),
        kelasId: { in: kelasIds },
      }
    }

    const [presensi, total] = await Promise.all([
      prisma.presensi.findMany({
        where,
        include: {
          siswa: {
            include: { kelas: true },
          },
        },
        orderBy: [{ tanggal: 'desc' }, { siswa: { kelasId: 'asc' } }, { siswa: { nama: 'asc' } }],
        skip: (pageNum - 1) * limitNum,
        take: limitNum,
      }),
      prisma.presensi.count({ where }),
    ])

    res.json({
      success: true,
      data: presensi,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    })
  } catch (error) {
    console.error('Laporan error:', error)
    res.status(500).json({ success: false, error: 'Gagal memuat laporan' })
  }
})

export default router
