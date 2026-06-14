import { PrismaClient, Role, Semester, StatusPresensi, JenisKelamin } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

const FIRST_NAMES_M = [
  'Ahmad', 'Budi', 'Chandra', 'Dimas', 'Eko', 'Fajar', 'Gilang', 'Hendra',
  'Irfan', 'Joko', 'Kevin', 'Lukman', 'Muhammad', 'Nanda', 'Oscar', 'Putra',
  'Qori', 'Rudi', 'Sigit', 'Taufik', 'Umar', 'Vino', 'Wahyu', 'Yusuf',
  'Zaky', 'Adi', 'Bayu', 'Catur', 'Doni', 'Edi',
]

const FIRST_NAMES_F = [
  'Aisyah', 'Bunga', 'Citra', 'Dewi', 'Fatimah', 'Hana', 'Indah', 'Julia',
  'Kartika', 'Lestari', 'Mega', 'Nurul', 'Putri', 'Qurrota', 'Rina', 'Sari',
  'Tasya', 'Uswatun', 'Vina', 'Wulandari', 'Zahra', 'Anisa', 'Dian', 'Fitri',
  'Halimah', 'Intan', 'Kumala', 'Melati', 'Nadia', 'Rahma',
]

const LAST_NAMES = [
  'Santoso', 'Wijaya', 'Pratama', 'Kusuma', 'Saputra', 'Hidayat', 'Nugroho',
  'Susanto', 'Setiawan', 'Hartono', 'Gunawan', 'Wibowo', 'Purnomo', 'Maulana',
  'Ramadhan', 'Fauzi', 'Prasetyo', 'Utama', 'Prayoga', 'Permata', 'Azzahra',
  'Ningrum', 'Rahmawati', 'Safitri', 'Amalia', 'Murni', 'Mulyani', 'Hasanah',
  'Fitriani', 'Handayani',
]

function randomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function pad(n: number, len = 4): string {
  return String(n).padStart(len, '0')
}

function generateNis(baseYear: number, index: number): string {
  return `${baseYear}${pad(index, 4)}`
}

function generateNisn(index: number): string {
  return `${pad(Math.floor(Math.random() * 9000000 + 1000000))}${pad(index, 4)}`
}

const birthDates = [
  '2014-03-15', '2014-07-22', '2014-11-08', '2014-05-30', '2014-09-12',
  '2014-01-18', '2014-04-25', '2014-08-14', '2014-10-03', '2014-12-20',
  '2014-02-10', '2014-06-28', '2014-07-05', '2014-09-19', '2014-11-30',
  '2014-03-08', '2014-05-16', '2014-08-27', '2014-10-15', '2014-12-05',
  '2013-04-12', '2013-08-29', '2013-01-25', '2013-06-17', '2013-10-08',
  '2013-02-14', '2013-07-30', '2013-09-22', '2013-11-11', '2013-05-06',
  '2012-02-20', '2012-06-10', '2012-09-28', '2012-01-08', '2012-05-19',
  '2012-08-14', '2012-11-25', '2012-03-30', '2012-07-05', '2012-10-18',
  '2011-03-22', '2011-07-15', '2011-11-04', '2011-01-28', '2011-05-11',
  '2011-09-06', '2011-12-18', '2011-02-09', '2011-06-25', '2011-10-14',
  '2010-02-18', '2010-05-07', '2010-09-23', '2010-12-12', '2010-01-03',
  '2010-04-16', '2010-07-29', '2010-10-21', '2010-11-14', '2010-08-09',
  '2009-04-05', '2009-08-20', '2009-11-15', '2009-01-12', '2009-05-28',
  '2009-09-09', '2009-12-24', '2009-02-07', '2009-06-14', '2009-10-30',
  '2008-03-10', '2008-07-26', '2008-10-31', '2008-01-18', '2008-05-04',
  '2008-09-15', '2008-12-05', '2008-02-22', '2008-06-11', '2008-08-28',
  '2014-04-02', '2014-08-18', '2014-12-10', '2014-03-28', '2014-06-07',
  '2014-09-14', '2014-11-22', '2014-01-06', '2014-05-20', '2014-10-11',
  '2013-03-05', '2013-07-19', '2013-11-29', '2013-02-17', '2013-06-13',
  '2013-09-25', '2013-12-08', '2013-01-20', '2013-04-29', '2013-08-10',
  '2012-04-08', '2012-08-22', '2012-12-01', '2012-03-15', '2012-07-09',
  '2012-10-27', '2012-01-13', '2012-05-25', '2012-09-03', '2012-11-19',
  '2011-04-14', '2011-09-28', '2011-12-30', '2011-02-25', '2011-06-03',
  '2011-10-07', '2011-01-15', '2011-05-30', '2011-08-22', '2011-11-10',
]

const places = [
  'Surabaya', 'Sidoarjo', 'Gresik', 'Malang', 'Pasuruan', 'Mojokerto',
  'Lamongan', 'Tuban', 'Bojonegoro', 'Ngawi', 'Madiun', 'Kediri',
  'Blitar', 'Tulungagung', 'Trenggalek', 'Ponorogo', 'Magetan', 'Jombang',
  'Nganjuk', 'Probolinggo', 'Bangkalan', 'Sampang', 'Pamekasan', 'Sumenep',
  'Jakarta', 'Bandung', 'Semarang', 'Yogyakarta', 'Solo', 'Denpasar',
]

const jalanList = [
  'Jl. Merdeka No.', 'Jl. Sudirman No.', 'Jl. Diponegoro No.', 'Jl. Ahmad Yani No.',
  'Jl. Pahlawan No.', 'Jl. Gajah Mada No.', 'Jl. Pattimura No.', 'Jl. Kartini No.',
  'Jl. Imam Bonjol No.', 'Jl. Hayam Wuruk No.', 'Jl. S Parman No.', 'Jl. MT Haryono No.',
]

const kotaList = [
  'Surabaya', 'Sidoarjo', 'Gresik', 'Malang', 'Pasuruan', 'Mojokerto',
]

async function main() {
  console.log('🌱 Seeding database...')
  const startTime = Date.now()

  // ── Tahun Ajaran ──
  const tahunAjaran = await prisma.tahunAjaran.upsert({
    where: { tahun_semester: { tahun: '2025/2026', semester: 'GENAP' } },
    update: {},
    create: {
      tahun: '2025/2026',
      semester: 'GENAP',
      isActive: true,
      tanggalMulai: new Date('2026-01-05'),
      tanggalSelesai: new Date('2026-06-27'),
    },
  })
  console.log(`✓ Tahun Ajaran: ${tahunAjaran.tahun} Semester ${tahunAjaran.semester}`)

  // ── Users (Admin + Guru) ──
  const adminPassword = await bcrypt.hash('admin123', 12)
  const guruPassword = await bcrypt.hash('guru123', 12)

  await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: { username: 'admin', password: adminPassword, role: 'ADMIN', nama: 'Administrator SIKHA' },
  })

  const guruData = [
    { username: 'guru1', nama: 'Siti Aminah, S.Pd.' },
    { username: 'guru2', nama: 'Ahmad Hidayat, S.Pd.' },
    { username: 'guru3', nama: 'Dewi Sartika, S.Pd.' },
    { username: 'guru4', nama: 'Bambang Supriyadi, S.Pd.' },
    { username: 'guru5', nama: 'Ratna Dewi, S.Pd.' },
    { username: 'guru6', nama: 'Hasan Basri, S.Pd.I.' },
    { username: 'guru7', nama: 'Fitri Handayani, S.Pd.' },
    { username: 'guru8', nama: 'Rudi Hartono, S.Pd.' },
  ]

  const gurus: Record<string, string> = {}
  for (const g of guruData) {
    const user = await prisma.user.upsert({
      where: { username: g.username },
      update: {},
      create: { username: g.username, password: guruPassword, role: 'GURU', nama: g.nama },
    })
    gurus[g.username] = user.id
  }
  console.log(`✓ Users: ${guruData.length + 1} (admin + ${guruData.length} guru, password: guru123)`)

  // ── Kelas ──
  async function getOrCreateKelas(nama: string, waliKelasId?: string) {
    const existing = await prisma.kelas.findFirst({
      where: { nama, tahunAjaranId: tahunAjaran.id },
    })
    if (existing) {
      if (waliKelasId) {
        return prisma.kelas.update({ where: { id: existing.id }, data: { waliKelasId } })
      }
      return existing
    }
    return prisma.kelas.create({
      data: { nama, waliKelasId, tahunAjaranId: tahunAjaran.id },
    })
  }

  const daftarKelas: { id: string; nama: string }[] = []
  const kelasGuruMap: Record<string, string> = {
    '1A': 'guru1', '1B': 'guru2',
    '2A': 'guru3', '2B': 'guru4',
    '3A': 'guru1', '3B': 'guru2',
    '4A': 'guru5', '4B': 'guru6',
    '5A': 'guru7', '5B': 'guru8',
    '6A': 'guru3', '6B': 'guru4',
  }

  for (const [nama, username] of Object.entries(kelasGuruMap)) {
    const kelas = await getOrCreateKelas(nama, gurus[username])
    daftarKelas.push({ id: kelas.id, nama })
  }
  console.log(`✓ Kelas: ${daftarKelas.length} kelas (${daftarKelas.map(k => k.nama).join(', ')})`)

  // ── Siswa (10 per kelas × 12 kelas = 120) ──
  type StudentSeed = {
    nama: string
    gender: JenisKelamin
  }

  // Generate nama dan gender mixed untuk tiap kelas
  function generateStudentNames(kelasIndex: number): StudentSeed[] {
    const students: StudentSeed[] = []
    for (let i = 0; i < 10; i++) {
      const isMale = Math.random() > 0.5
      const firstName = isMale
        ? FIRST_NAMES_M[(kelasIndex * 10 + i) % FIRST_NAMES_M.length]
        : FIRST_NAMES_F[(kelasIndex * 10 + i) % FIRST_NAMES_F.length]
      const lastName = LAST_NAMES[(kelasIndex * 10 + i * 3) % LAST_NAMES.length]
      students.push({
        nama: `${firstName} ${lastName}`,
        gender: isMale ? 'LAKI_LAKI' : 'PEREMPUAN',
      })
    }
    return students
  }

  let totalSiswa = 0
  for (let k = 0; k < daftarKelas.length; k++) {
    const kelas = daftarKelas[k]
    const baseNis = 2025000 + k * 10
    const students = generateStudentNames(k)

    for (let i = 0; i < students.length; i++) {
      const s = students[i]
      const nis = `${baseNis + i + 1}`
      const birthIdx = (k * 10 + i) % birthDates.length
      const tempat = places[(k * 10 + i) % places.length]
      const jalan = jalanList[(k * 10 + i) % jalanList.length]
      const kota = kotaList[(k * 10 + i) % kotaList.length]

      await prisma.siswa.upsert({
        where: { nis },
        update: {},
        create: {
          nis,
          nisn: generateNisn(k * 10 + i + 1),
          nama: s.nama,
          jenisKelamin: s.gender,
          tempatLahir: tempat,
          tanggalLahir: new Date(birthDates[birthIdx]),
          alamat: `${jalan}${(i % 20) + 1}, ${kota}`,
          namaAyah: randomItem(FIRST_NAMES_M) + ' ' + randomItem(LAST_NAMES),
          namaIbu: randomItem(FIRST_NAMES_F) + ' ' + randomItem(LAST_NAMES),
          noTelpOrtu: `081${pad(Math.floor(Math.random() * 90000000 + 10000000), 8)}`,
          tahunMasuk: 2020 + Math.floor(k / 2),
          kelasId: kelas.id,
        },
      })
      totalSiswa++
    }
  }
  console.log(`✓ Siswa: ${totalSiswa} siswa`)

  // ── Jam Presensi ──
  const jamDefault = await prisma.jamPresensi.findFirst({ where: { isActive: true } })
  if (!jamDefault) {
    await prisma.jamPresensi.create({
      data: { jamMasuk: '07:00', toleransiMenit: 15, jamPulang: '13:00', isActive: true },
    })
    console.log('✓ Jam Presensi: 07:00 (toleransi 15 menit)')
  } else {
    console.log('✓ Jam Presensi: sudah ada (skip)')
  }

  // ── Presensi History (7 hari terakhir, skip weekend) ──
  const allSiswa = await prisma.siswa.findMany({ select: { id: true, kelasId: true } })
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  let totalPresensi = 0
  const semesterStart = new Date('2026-01-05')

  // Generate presensi untuk 14 hari terakhir (hanya weekday)
  const presensiDates: Date[] = []
  for (let d = 1; d <= 21; d++) {
    const date = new Date(today)
    date.setDate(date.getDate() - d)
    if (date >= semesterStart) {
      const day = date.getDay()
      if (day !== 0 && day !== 6) { // skip Sunday (0) and Saturday (6)
        presensiDates.push(date)
      }
    }
  }

  // Ambil data yang sudah ada untuk menghindari duplikasi
  const existingKeys = new Set<string>()
  const existingPresensi = await prisma.presensi.findMany({
    where: { tanggal: { in: presensiDates } },
    select: { siswaId: true, tanggal: true },
  })
  for (const p of existingPresensi) {
    existingKeys.add(`${p.siswaId}_${p.tanggal.toISOString()}`)
  }

  if (presensiDates.length > 0) {
    const presensiBatch: {
      siswaId: string
      tanggal: Date
      status: string
      jamDatang: Date | null
      keterangan: string | null
      kelasId: string | null
      tahunAjaranId: string | null
    }[] = []

    for (const date of presensiDates) {
      for (const siswa of allSiswa) {
        const key = `${siswa.id}_${date.toISOString()}`
        if (existingKeys.has(key)) continue

        // Weighted random status
        const roll = Math.random()
        let status: string
        let jamDatang: Date | null = null
        let keterangan: string | null = null

        if (roll < 0.75) {
          status = 'HADIR'
          jamDatang = new Date(date)
          jamDatang.setHours(6, 45 + Math.floor(Math.random() * 25), Math.floor(Math.random() * 60))
        } else if (roll < 0.82) {
          status = 'TERLAMBAT'
          jamDatang = new Date(date)
          jamDatang.setHours(7, 20 + Math.floor(Math.random() * 30), Math.floor(Math.random() * 60))
        } else if (roll < 0.90) {
          status = 'IZIN'
          keterangan = randomItem(['Izin acara keluarga', 'Izin dokter', 'Izin hajatan', 'Izin perjalanan'])
        } else if (roll < 0.96) {
          status = 'SAKIT'
          keterangan = randomItem(['Demam', 'Batuk pilek', 'Sakit perut', 'Sakit gigi', 'Flu'])
        } else {
          status = 'ALFA'
        }

        presensiBatch.push({
          siswaId: siswa.id,
          tanggal: date,
          status,
          jamDatang,
          keterangan,
          kelasId: siswa.kelasId,
          tahunAjaranId: tahunAjaran.id,
        })
      }
    }

    // Batch insert presensi (pakai createMany karena skipDuplicates)
    if (presensiBatch.length > 0) {
      // Prisma's createMany with skipDuplicates handles the unique constraint
      for (let i = 0; i < presensiBatch.length; i += 100) {
        const batch = presensiBatch.slice(i, i + 100)
        await prisma.presensi.createMany({
          data: batch as any,
          skipDuplicates: true,
        })
      }
      totalPresensi = presensiBatch.length
      console.log(`✓ Presensi History: ${totalPresensi} data (${presensiDates.length} hari × ${allSiswa.length} siswa)`)
    } else {
      console.log('✓ Presensi History: sudah ada (skip)')
    }
  } else {
    console.log('✓ Presensi History: tidak ada hari kerja dalam rentang')
  }

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1)
  console.log(`\n✅ Seed selesai dalam ${elapsed}s!`)
  console.log('─── Login ───')
  console.log('  Admin : admin / admin123')
  for (const g of guruData) {
    console.log(`  Guru  : ${g.username} / guru123 (${g.nama})`)
  }
  console.log(`────────────`)
  console.log(`📊 Total: ${daftarKelas.length} kelas, ${totalSiswa} siswa, ${totalPresensi} data presensi`)
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
