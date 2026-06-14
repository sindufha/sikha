import { Router, Request, Response } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import prisma from '../lib/prisma'
import { loginSchema } from '../lib/validation'
import { catatAudit } from '../lib/audit'

const router = Router()
const JWT_SECRET = process.env.JWT_SECRET
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET tidak dikonfigurasi di environment variables')
}
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d'

router.post('/login', async (req: Request, res: Response) => {
  try {
    const parsed = loginSchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        error: parsed.error.issues[0].message,
      })
    }

    const { username, password } = parsed.data

    const user = await prisma.user.findUnique({ where: { username } })
    if (!user) {
      return res.status(401).json({ success: false, error: 'Username atau password salah' })
    }

    if (!user.isActive) {
      return res.status(401).json({ success: false, error: 'Akun telah dinonaktifkan' })
    }

    const valid = await bcrypt.compare(password, user.password)
    if (!valid) {
      return res.status(401).json({ success: false, error: 'Username atau password salah' })
    }

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    })

    // Durasi token dari env, dengan fallback 7 hari
    let expiresIn: number = 7 * 24 * 60 * 60 // 7 hari dalam detik
    const match = JWT_EXPIRES_IN.match(/^(\d+)([dhms])$/)
    if (match) {
      const val = parseInt(match[1])
      const unit = match[2]
      const multipliers: Record<string, number> = { d: 86400, h: 3600, m: 60, s: 1 }
      expiresIn = val * (multipliers[unit] || 86400)
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role, nama: user.nama },
      JWT_SECRET,
      { expiresIn }
    )

    // Catat audit login
    await catatAudit({
      aksi: 'LOGIN',
      userId: user.id,
      deskripsi: `Login sebagai ${user.role} (${user.nama})`,
      req,
    })

    res.json({
      success: true,
      data: {
        token,
        expiresIn,
        user: {
          id: user.id,
          username: user.username,
          role: user.role,
          nama: user.nama,
        },
      },
    })
  } catch (error) {
    console.error('Login error:', error)
    res.status(500).json({ success: false, error: 'Terjadi kesalahan server' })
  }
})

router.get('/me', async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, error: 'Tidak terautentikasi' })
    }

    const token = authHeader.split(' ')[1]
    const decoded: any = jwt.verify(token, JWT_SECRET!)
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { id: true, username: true, role: true, nama: true, isActive: true },
    })

    if (!user) {
      return res.status(401).json({ success: false, error: 'User tidak ditemukan' })
    }

    if (!user.isActive) {
      return res.status(401).json({ success: false, error: 'Akun telah dinonaktifkan' })
    }

    res.json({ success: true, data: user })
  } catch (error) {
    res.status(401).json({ success: false, error: 'Token tidak valid' })
  }
})

export default router
