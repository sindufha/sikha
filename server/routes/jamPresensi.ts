import { Router, Response } from 'express'
import { authenticate, authorize, AuthRequest } from '../middleware/auth'
import prisma from '../lib/prisma'
import { jamPresensiSchema } from '../lib/validation'

const router = Router()
router.use(authenticate)
router.use(authorize('ADMIN'))

router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const jam = await prisma.jamPresensi.findFirst({
      where: { isActive: true },
    })

    if (!jam) {
      return res.json({ success: true, data: null })
    }

    res.json({ success: true, data: jam })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Gagal memuat pengaturan jam' })
  }
})

router.put('/', async (req: AuthRequest, res: Response) => {
  try {
    const parsed = jamPresensiSchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({ success: false, error: parsed.error.issues[0].message })
    }

    const { jamMasuk, toleransiMenit, jamPulang } = parsed.data

    await prisma.jamPresensi.updateMany({
      where: { isActive: true },
      data: { isActive: false },
    })

    const jam = await prisma.jamPresensi.create({
      data: {
        jamMasuk,
        toleransiMenit,
        jamPulang: jamPulang || null,
        isActive: true,
      },
    })

    res.json({ success: true, data: jam, message: 'Pengaturan jam berhasil disimpan' })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Gagal menyimpan pengaturan jam' })
  }
})

export default router