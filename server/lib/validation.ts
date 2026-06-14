import { z } from 'zod'

// ── Role & Status Enum ──
const roleEnum = z.enum(['ADMIN', 'GURU'])
const statusPresensiEnum = z.enum(['HADIR', 'IZIN', 'SAKIT', 'ALFA', 'TERLAMBAT'])
const jenisKelaminEnum = z.enum(['LAKI_LAKI', 'PEREMPUAN']).optional()

// ── Password ──
const passwordSchema = z
  .string('Password harus diisi')
  .min(8, 'Password minimal 8 karakter')

// ── Auth ──
export const loginSchema = z.object({
  username: z.string('Username harus diisi').min(1, 'Username harus diisi'),
  password: z.string('Password harus diisi').min(1, 'Password harus diisi'),
})

// ── User ──
export const createUserSchema = z.object({
  username: z.string('Username harus diisi').min(3, 'Username minimal 3 karakter'),
  password: passwordSchema,
  role: roleEnum,
  nama: z.string('Nama harus diisi').min(1, 'Nama harus diisi'),
})

export const updateUserSchema = z.object({
  username: z.string().min(3, 'Username minimal 3 karakter').optional(),
  password: z.string().min(8, 'Password minimal 8 karakter').optional(),
  role: roleEnum.optional(),
  nama: z.string().min(1, 'Nama harus diisi').optional(),
})

// ── Kelas ──
export const createKelasSchema = z.object({
  nama: z.string('Nama kelas harus diisi').min(1, 'Nama kelas harus diisi'),
  waliKelasId: z.string().optional().nullable(),
  tahunAjaranId: z.string().optional().nullable(),
})

export const updateKelasSchema = z.object({
  nama: z.string().min(1, 'Nama kelas harus diisi'),
  waliKelasId: z.string().optional().nullable(),
  tahunAjaranId: z.string().optional().nullable(),
})

// ── Siswa ──
export const createSiswaSchema = z.object({
  nis: z.string('NIS harus diisi').min(1, 'NIS harus diisi'),
  nisn: z.string().optional().nullable(),
  nama: z.string('Nama harus diisi').min(1, 'Nama harus diisi'),
  jenisKelamin: jenisKelaminEnum.optional().nullable(),
  tempatLahir: z.string().optional().nullable(),
  tanggalLahir: z.string().optional().nullable(),
  alamat: z.string().optional().nullable(),
  namaAyah: z.string().optional().nullable(),
  namaIbu: z.string().optional().nullable(),
  noTelpOrtu: z.string().optional().nullable(),
  tahunMasuk: z.union([z.string(), z.number()]).transform(v => typeof v === 'string' ? parseInt(v) : v).pipe(z.number().int().min(1900).max(2100)).optional().nullable(),
  kelasId: z.string('Kelas harus dipilih').min(1, 'Kelas harus dipilih'),
})

export const updateSiswaSchema = z.object({
  nis: z.string().min(1, 'NIS harus diisi'),
  nisn: z.string().optional().nullable(),
  nama: z.string().min(1, 'Nama harus diisi'),
  jenisKelamin: jenisKelaminEnum.optional().nullable(),
  tempatLahir: z.string().optional().nullable(),
  tanggalLahir: z.string().optional().nullable(),
  alamat: z.string().optional().nullable(),
  namaAyah: z.string().optional().nullable(),
  namaIbu: z.string().optional().nullable(),
  noTelpOrtu: z.string().optional().nullable(),
  tahunMasuk: z.union([z.string(), z.number()]).transform(v => typeof v === 'string' ? parseInt(v) : v).pipe(z.number().int().min(1900).max(2100)).optional().nullable(),
  kelasId: z.string().min(1, 'Kelas harus dipilih'),
})

// ── Presensi ──
export const presensiManualItemSchema = z.object({
  siswaId: z.string('Siswa harus dipilih').min(1, 'Siswa harus dipilih'),
  status: statusPresensiEnum,
  keterangan: z.string().optional().nullable(),
})

export const presensiManualSchema = z.object({
  presensiList: z
    .array(presensiManualItemSchema)
    .min(1, 'Minimal 1 data presensi'),
})

export const presensiQrSchema = z.object({
  qrData: z.object({
    type: z.string().optional(),
    siswaId: z.string('Data QR tidak valid').min(1, 'Data QR tidak valid'),
    nis: z.string().optional(),
    nama: z.string().optional(),
    kelas: z.string().optional(),
    timestamp: z.number('QR Code tidak valid'),
  }),
  timestamp: z.number().optional(),
})

// ── Jam Presensi ──
export const jamPresensiSchema = z.object({
  jamMasuk: z
    .string('Jam masuk harus diisi')
    .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Format jam harus HH:mm'),
  toleransiMenit: z
    .union([z.string(), z.number()])
    .transform((v) => (typeof v === 'string' ? parseInt(v) : v))
    .pipe(z.number().min(0, 'Toleransi tidak boleh negatif').max(120, 'Toleransi maksimal 120 menit'))
    .default(15),
  jamPulang: z
    .string()
    .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Format jam harus HH:mm')
    .optional()
    .nullable(),
})

// ── Laporan ──
export const laporanQuerySchema = z.object({
  kelasId: z.string().optional(),
  tanggalMulai: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Format tanggal harus YYYY-MM-DD')
    .optional(),
  tanggalSelesai: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Format tanggal harus YYYY-MM-DD')
    .optional(),
  status: statusPresensiEnum.optional(),
  page: z.string().optional().default('1'),
  limit: z.string().optional().default('50'),
})
