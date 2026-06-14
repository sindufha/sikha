import { Router, Response } from 'express'
import { authenticate, authorize, AuthRequest } from '../middleware/auth'
import prisma from '../lib/prisma'

const router = Router()
router.use(authenticate)
router.use(authorize('GURU'))

router.get('/dashboard', async (req: AuthRequest, res: Response) => {
  try {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const kelas = await prisma.kelas.findMany({
      where: { waliKelasId: req.user!.id },
      include: { _count: { select: { siswa: true } } },
    })

    const semuaSiswa = await prisma.siswa.findMany({
      where: {
        kelasId: { in: kelas.map(k => k.id) },
        isActive: true,
      },
      include: {
        presensi: {
          where: { tanggal: { gte: today, lt: tomorrow } },
          take: 1,
        },
        kelas: true,
      },
      orderBy: [{ kelasId: 'asc' }, { nama: 'asc' }],
    })

    const hadir = semuaSiswa.filter(s => s.presensi[0]?.status === 'HADIR').length
    const izin = semuaSiswa.filter(s => s.presensi[0]?.status === 'IZIN').length
    const sakit = semuaSiswa.filter(s => s.presensi[0]?.status === 'SAKIT').length
    const alfa = semuaSiswa.filter(s => s.presensi[0]?.status === 'ALFA').length
    const terlambat = semuaSiswa.filter(s => s.presensi[0]?.status === 'TERLAMBAT').length
    const belumPresensi = semuaSiswa.filter(s => s.presensi.length === 0).length

    res.json({
      success: true,
      data: {
        kelas,
        siswa: semuaSiswa,
        stats: { totalSiswa: semuaSiswa.length, hadir, izin, sakit, alfa, terlambat, belumPresensi },
      },
    })
  } catch (error) {
    console.error('Guru dashboard error:', error)
    res.status(500).json({ success: false, error: 'Gagal memuat dashboard' })
  }
})

export default router
