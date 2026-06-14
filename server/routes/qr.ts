import { Router, Response } from 'express'
import QRCode from 'qrcode'
import { authenticate, authorize, AuthRequest } from '../middleware/auth'
import prisma from '../lib/prisma'

const router = Router()
router.use(authenticate)
router.use(authorize('ADMIN', 'GURU'))

router.get('/kelas/:kelasId', async (req: AuthRequest, res: Response) => {
  try {
    const siswaList = await prisma.siswa.findMany({
      where: { kelasId: req.params.kelasId },
      include: { kelas: true },
      orderBy: { nama: 'asc' },
    })

    const qrCodes = await Promise.all(
      siswaList.map(async (siswa) => {
        const qrData = JSON.stringify({
          type: 'SISWA',
          siswaId: siswa.id,
          nis: siswa.nis,
          nama: siswa.nama,
          kelas: siswa.kelas.nama,
          timestamp: Date.now(),
        })
        const qrImage = await QRCode.toDataURL(qrData, {
          errorCorrectionLevel: 'M',
          margin: 2,
          width: 256,
          color: { dark: '#2D3436', light: '#FFF5F5' },
        })
        return {
          siswaId: siswa.id,
          nis: siswa.nis,
          nama: siswa.nama,
          kelas: siswa.kelas.nama,
          qrCode: qrImage,
        }
      })
    )

    const namaKelas = siswaList[0]?.kelas?.nama || ''
    res.json({ success: true, data: { kelas: namaKelas, siswa: qrCodes } })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Gagal generate QR Code' })
  }
})

router.get('/semua', async (req: AuthRequest, res: Response) => {
  try {
    const siswaList = await prisma.siswa.findMany({
      include: { kelas: true },
      orderBy: [{ kelasId: 'asc' }, { nama: 'asc' }],
    })

    const qrCodes = await Promise.all(
      siswaList.map(async (siswa) => {
        const qrData = JSON.stringify({
          type: 'SISWA',
          siswaId: siswa.id,
          nis: siswa.nis,
          nama: siswa.nama,
          kelas: siswa.kelas.nama,
          timestamp: Date.now(),
        })
        const qrImage = await QRCode.toDataURL(qrData, {
          errorCorrectionLevel: 'M',
          margin: 2,
          width: 256,
          color: { dark: '#2D3436', light: '#FFF5F5' },
        })
        return {
          siswaId: siswa.id,
          nis: siswa.nis,
          nama: siswa.nama,
          kelas: siswa.kelas.nama,
          qrCode: qrImage,
        }
      })
    )

    res.json({ success: true, data: { total: siswaList.length, siswa: qrCodes } })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Gagal generate QR Code' })
  }
})

export default router