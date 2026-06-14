import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'

const JWT_SECRET: string = process.env.JWT_SECRET || (() => { throw new Error('JWT_SECRET tidak dikonfigurasi di environment variables') })()

export interface AuthRequest extends Request {
  user?: {
    id: string
    username: string
    role: 'ADMIN' | 'GURU'
    nama: string
  }
}

export function authenticate(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, error: 'Silakan login terlebih dahulu' })
  }

  const token = authHeader.split(' ')[1]
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any
    req.user = {
      id: decoded.id,
      username: decoded.username,
      role: decoded.role,
      nama: decoded.nama,
    }
    next()
  } catch {
    return res.status(401).json({ success: false, error: 'Sesi telah habis, silakan login ulang' })
  }
}

export function authorize(...roles: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Silakan login terlebih dahulu' })
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ success: false, error: 'Anda tidak memiliki akses ke halaman ini' })
    }
    next()
  }
}
