import { Router, Response } from 'express'
import { authenticate, AuthRequest } from '../middleware/auth'
import prisma from '../lib/prisma'
import { presensiManualSchema, presensiQrSchema } from '../lib/validation'
import { catatAudit } from '../lib/audit'

const router = Router()
router.use(authenticate)

router.post('/manual', async (req: AuthRequest, res: Response) => {
  try {
    const parsed = presensiManualSchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({ success: false, error: parsed.error.issues[0].message })
    }

    const { presensiList } = parsed.data
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Batch fetch semua siswa yang diperlukan (1 query)
    const siswaIds = presensiList.map(i => i.siswaId).filter(Boolean)
    const semuaSiswa = await prisma.siswa.findMany({
      where: { id: { in: siswaIds } },
      select: { id: true, kelasId: true },
    })
    const siswaMap = new Map(semuaSiswa.map(s => [s.id, s]))

    // Ambil tahun ajaran aktif (1 query)
    const tahunAjaran = await prisma.tahunAjaran.findFirst({ where: { isActive: true } })

    // Build parameterized batch upsert — satu query untuk semua siswa
    const params: any[] = []
    const valueStrings: string[] = []
    let idx = 1

    for (const item of presensiList) {
      const { siswaId, status, keterangan } = item
      if (!siswaId || !status) continue

      const siswa = siswaMap.get(siswaId)
      if (!siswa) continue

      const jamDatang = (status === 'HADIR' || status === 'TERLAMBAT') ? new Date() : null

      params.push(
        siswaId,                     // $idx   — siswa_id
        today,                       // $idx+1 — tanggal
        status,                      // $idx+2 — status (enum)
        jamDatang,                   // $idx+3 — jam_datang
        siswa.kelasId,               // $idx+4 — kelas_id
        keterangan || null,          // $idx+5 — keterangan
        tahunAjaran?.id || null,     // $idx+6 — tahun_ajaran_id
      )

      valueStrings.push(
        `($${idx}::text, $${idx + 1}::date, $${idx + 2}::"StatusPresensi", $${idx + 3}::timestamptz, $${idx + 4}::text, $${idx + 5}::text, $${idx + 6}::text)`,
      )
      idx += 7
    }

    if (valueStrings.length === 0) {
      return res.json({ success: true, data: [], message: 'Tidak ada data presensi valid' })
    }

    // Single batch upsert — satu round trip untuk semua siswa
    // Sebelumnya: N round trip (tiap siswa upsert sendiri) dalam transaction 30s
    // Sekarang: 1 query INSERT ... ON CONFLICT DO UPDATE untuk semua siswa
    await prisma.$executeRawUnsafe(`
      INSERT INTO presensi (siswa_id, tanggal, status, jam_datang, kelas_id, keterangan, tahun_ajaran_id)
      VALUES ${valueStrings.join(', ')}
      ON CONFLICT (siswa_id, tanggal) DO UPDATE SET
        status      = EXCLUDED.status,
        jam_datang  = COALESCE(EXCLUDED.jam_datang, presensi.jam_datang),
        keterangan  = EXCLUDED.keterangan,
        kelas_id    = COALESCE(EXCLUDED.kelas_id, presensi.kelas_id),
        tahun_ajaran_id = COALESCE(EXCLUDED.tahun_ajaran_id, presensi.tahun_ajaran_id),
        updated_at  = NOW()
    `, ...params)

    // Catat audit
    await catatAudit({
      aksi: 'CREATE_PRESENSI',
      userId: req.user?.id,
      deskripsi: `Presensi manual untuk ${presensiList.length} siswa`,
      detail: { jumlah: presensiList.length, tanggal: today.toISOString() },
      req: req as any,
    })

    res.json({ success: true, data: [], message: `Presensi berhasil disimpan untuk ${valueStrings.length} siswa` })
  } catch (error) {
    console.error('Manual presensi error:', error)
    const message = error instanceof Error ? error.message : 'Gagal menyimpan presensi'
    res.status(500).json({ success: false, error: message })
  }
})

router.post('/qr', async (req: AuthRequest, res: Response) => {
  try {
    const parsed = presensiQrSchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({ success: false, error: 'QR Code tidak valid' })
    }

    const { qrData } = parsed.data

    const siswa = await prisma.siswa.findUnique({
      where: { id: qrData.siswaId },
      include: { kelas: true },
    })

    if (!siswa) {
      return res.status(404).json({ success: false, error: 'Siswa tidak ditemukan' })
    }

    if (!siswa.isActive) {
      return res.status(400).json({ success: false, error: 'Siswa sudah tidak aktif' })
    }

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const existingPresensi = await prisma.presensi.findUnique({
      where: { siswaId_tanggal: { siswaId: siswa.id, tanggal: today } },
    })

    if (existingPresensi) {
      return res.status(400).json({ success: false, error: `${siswa.nama} sudah melakukan presensi hari ini` })
    }

    const jamPresensi = await prisma.jamPresensi.findFirst({ where: { isActive: true } })
    const jamDatang = new Date()
    let status: string = 'HADIR'

    if (jamPresensi) {
      const [jam, menit] = jamPresensi.jamMasuk.split(':').map(Number)
      const batasTepat = new Date()
      batasTepat.setHours(jam, menit + jamPresensi.toleransiMenit, 0, 0)

      if (jamDatang > batasTepat) {
        status = 'TERLAMBAT'
      }
    }

    // Cari tahun ajaran aktif
    const tahunAjaran = await prisma.tahunAjaran.findFirst({ where: { isActive: true } })

    const presensi = await prisma.presensi.create({
      data: {
        siswaId: siswa.id,
        tanggal: today,
        kelasId: siswa.kelasId,
        status: status as any,
        jamDatang,
        tahunAjaranId: tahunAjaran?.id || null,
      },
      include: { siswa: { include: { kelas: true } } },
    })

    res.json({
      success: true,
      data: {
        id: presensi.id,
        siswaId: presensi.siswaId,
        nama: presensi.siswa.nama,
        nis: presensi.siswa.nis,
        kelas: presensi.siswa.kelas.nama,
        status: presensi.status,
        jamDatang: presensi.jamDatang,
      },
      message: `Presensi berhasil untuk ${siswa.nama}`,
    })
  } catch (error) {
    console.error('QR presensi error:', error)
    res.status(500).json({ success: false, error: 'Gagal memproses presensi QR' })
  }
})

// Daftar presensi QR hari ini — untuk ditampilkan di halaman scan
router.get('/recent-qr', async (req: AuthRequest, res: Response) => {
  try {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    // Filter hanya yang punya jamDatang (hasil scan QR)
    const presensi = await prisma.presensi.findMany({
      where: {
        tanggal: { gte: today, lt: tomorrow },
        jamDatang: { not: null },
      },
      select: {
        id: true,
        siswaId: true,
        status: true,
        jamDatang: true,
        siswa: {
          select: { nama: true, nis: true, kelas: { select: { nama: true } } },
        },
      },
      orderBy: { jamDatang: 'desc' },
      take: 50,
    })

    const data = presensi.map((p) => ({
      id: p.id,
      siswaId: p.siswaId,
      nama: p.siswa.nama,
      nis: p.siswa.nis,
      kelas: p.siswa.kelas.nama,
      status: p.status,
      jamDatang: p.jamDatang,
    }))

    res.json({ success: true, data })
  } catch (error) {
    console.error('Recent QR presensi error:', error)
    res.status(500).json({ success: false, error: 'Gagal memuat data presensi' })
  }
})

router.get('/hari-ini', async (req: AuthRequest, res: Response) => {
  try {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const presensi = await prisma.presensi.findMany({
      where: { tanggal: { gte: today, lt: tomorrow } },
      include: { siswa: { include: { kelas: true } } },
      orderBy: [{ siswa: { kelasId: 'asc' } }, { siswa: { nama: 'asc' } }],
    })

    res.json({ success: true, data: presensi })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Gagal memuat data presensi' })
  }
})

export default router
