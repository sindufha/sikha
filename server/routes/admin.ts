import { Router, Response } from 'express'
import { authenticate, authorize, AuthRequest } from '../middleware/auth'
import prisma from '../lib/prisma'

const router = Router()
router.use(authenticate)
router.use(authorize('ADMIN'))

router.get('/dashboard', async (req: AuthRequest, res: Response) => {
  try {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const [totalSiswa, totalSiswaAktif, totalKelas, totalGuru, presensiHariIni] = await Promise.all([
      prisma.siswa.count(),
      prisma.siswa.count({ where: { isActive: true } }),
      prisma.kelas.count(),
      prisma.user.count({ where: { role: 'GURU', isActive: true } }),
      prisma.presensi.findMany({
        where: {
          tanggal: { gte: today, lt: tomorrow },
        },
        include: { siswa: true },
      }),
    ])

    const stats = {
      totalSiswa,
      totalSiswaAktif,
      totalKelas,
      totalGuru,
      hadir: presensiHariIni.filter(p => p.status === 'HADIR').length,
      izin: presensiHariIni.filter(p => p.status === 'IZIN').length,
      sakit: presensiHariIni.filter(p => p.status === 'SAKIT').length,
      alfa: presensiHariIni.filter(p => p.status === 'ALFA').length,
      terlambat: presensiHariIni.filter(p => p.status === 'TERLAMBAT').length,
      totalPresensiHariIni: presensiHariIni.length,
    }

    const daftarKelas = await prisma.kelas.findMany({
      include: {
        _count: { select: { siswa: true } },
        waliKelas: { select: { nama: true } },
      },
    })

    res.json({ success: true, data: { stats, daftarKelas } })
  } catch (error) {
    console.error('Dashboard error:', error)
    res.status(500).json({ success: false, error: 'Gagal memuat dashboard' })
  }
})

router.get('/audit-logs', async (req: AuthRequest, res: Response) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1)
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 50))
    const { aksi, userId, tanggalMulai, tanggalSelesai } = req.query as Record<string, string | undefined>

    const where: any = {}
    if (aksi) where.aksi = aksi
    if (userId) where.userId = userId
    if (tanggalMulai || tanggalSelesai) {
      where.createdAt = {}
      if (tanggalMulai) where.createdAt.gte = new Date(tanggalMulai)
      if (tanggalSelesai) {
        const end = new Date(tanggalSelesai)
        end.setHours(23, 59, 59, 999)
        where.createdAt.lte = end
      }
    }

    const skip = (page - 1) * limit

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        include: {
          user: { select: { id: true, nama: true, username: true, role: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.auditLog.count({ where }),
    ])

    const enhancedLogs = logs.map(log => {
      const reasons: string[] = []
      const date = new Date(log.createdAt)
      const hari = date.getDay()
      const jam = date.getHours()

      if (hari === 0 || hari === 6) {
        reasons.push('Aktivitas di akhir pekan')
      }
      if (jam >= 22 || jam <= 4) {
        reasons.push('Aktivitas di luar jam wajar (22:00–04:59)')
      }
      if (log.aksi === 'CREATE_PRESENSI' && (log.detail as any)?.jumlah > 30) {
        reasons.push(`Presensi massal (${(log.detail as any).jumlah} siswa)`)
      }
      if (log.aksi === 'DELETE_USER' || log.aksi === 'RESET_PASSWORD' || log.aksi === 'DELETE_SISWA') {
        const label = log.aksi === 'DELETE_USER' ? 'menghapus pengguna'
          : log.aksi === 'RESET_PASSWORD' ? 'mereset password'
          : 'menghapus data siswa'
        reasons.push(`Tindakan sensitif: ${label}`)
      }

      return {
        ...log,
        isAnomaly: reasons.length > 0,
        anomalyReason: reasons.length > 0 ? reasons.join(' · ') : null,
      }
    })

    res.json({
      success: true,
      data: {
        logs: enhancedLogs,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    })
  } catch (error) {
    console.error('Audit logs error:', error)
    res.status(500).json({ success: false, error: 'Gagal memuat log aktivitas' })
  }
})

export default router
