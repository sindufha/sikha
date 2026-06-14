import express from 'express'
import cors from 'cors'
import authRoutes from './routes/auth'
import adminRoutes from './routes/admin'
import guruRoutes from './routes/guru'
import siswaRoutes from './routes/siswa'
import kelasRoutes from './routes/kelas'
import userRoutes from './routes/users'
import presensiRoutes from './routes/presensi'
import qrRoutes from './routes/qr'
import laporanRoutes from './routes/laporan'
import jamPresensiRoutes from './routes/jamPresensi'
import profilRoutes from './routes/profil'
import helmet from 'helmet'
import compression from 'compression'
import rateLimit from 'express-rate-limit'
import prisma from './lib/prisma'

const app = express()
const PORT = process.env.PORT || 3001

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not set in environment variables')
}
if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET is not set in environment variables')
}

app.use(cors({
  origin: process.env.VITE_FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}))

app.use(helmet({ crossOriginResourcePolicy: false }))
app.use(compression())

app.use(express.json({ limit: '10mb' }))

const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: { success: false, error: 'Too many requests, please try again later' },
})

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { success: false, error: 'Too many login attempts, please try again later' },
})

app.use(globalLimiter)
app.use('/api/auth', authLimiter, authRoutes)
app.use('/api/admin', adminRoutes)
app.use('/api/guru', guruRoutes)
app.use('/api/siswa', siswaRoutes)
app.use('/api/kelas', kelasRoutes)
app.use('/api/users', userRoutes)
app.use('/api/presensi', presensiRoutes)
app.use('/api/qr', qrRoutes)
app.use('/api/laporan', laporanRoutes)
app.use('/api/pengaturan/jam', jamPresensiRoutes)
app.use('/api/profil', profilRoutes)

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Server error:', err)
  const message = process.env.NODE_ENV === 'production' ? 'Terjadi kesalahan server' : err.message
  res.status(500).json({ success: false, error: message || 'Terjadi kesalahan server' })
})

const server = app.listen(PORT, () => {
  console.log(`SIKHA Server running on http://localhost:${PORT}`)
})

const gracefulShutdown = (signal: string) => {
  console.log(`Received ${signal}. Shutting down gracefully...`)
  server.close(() => {
    prisma.$disconnect()
    console.log('Server closed')
    process.exit(0)
  })
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'))
process.on('SIGINT', () => gracefulShutdown('SIGINT'))

export default app