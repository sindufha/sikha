import { Router, Response } from 'express'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { authenticate, AuthRequest } from '../middleware/auth'
import prisma from '../lib/prisma'
import { catatAudit } from '../lib/audit'

const router = Router()
router.use(authenticate)

const gantiPasswordSchema = z.object({
  passwordLama: z.string().min(1, 'Password lama harus diisi'),
  passwordBaru: z.string().min(4, 'Password baru minimal 4 karakter'),
})

router.put('/password', async (req: AuthRequest, res: Response) => {
  try {
    const parsed = gantiPasswordSchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({ success: false, error: parsed.error.issues[0].message })
    }

    const { passwordLama, passwordBaru } = parsed.data

    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
    })

    if (!user) {
      return res.status(404).json({ success: false, error: 'User tidak ditemukan' })
    }

    const isMatch = await bcrypt.compare(passwordLama, user.password)
    if (!isMatch) {
      return res.status(400).json({ success: false, error: 'Password lama tidak sesuai' })
    }

    const hashedPassword = await bcrypt.hash(passwordBaru, 12)

    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    })

    await catatAudit({
      aksi: 'RESET_PASSWORD',
      userId: req.user?.id,
      deskripsi: 'User mengganti password sendiri',
      detail: { username: user.username },
      req: req as any,
    })

    res.json({ success: true, message: 'Password berhasil diubah' })
  } catch (error) {
    console.error('Ganti password error:', error)
    const message = error instanceof Error ? error.message : 'Gagal mengganti password'
    res.status(500).json({ success: false, error: message })
  }
})

export default router
