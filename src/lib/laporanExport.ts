import * as XLSX from 'xlsx-js-style'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { STATUS_LABELS, type StatusPresensi } from '@/types'

type LaporanRecord = {
  id: string
  tanggal: string | Date
  status: StatusPresensi
  jamDatang?: string | Date | null
  keterangan?: string | null
  siswa?: {
    nis?: string
    nama?: string
    kelas?: {
      nama?: string
    } | null
  } | null
}

type ExportFilters = {
  kelasLabel?: string
  tanggalMulai?: string
  tanggalSelesai?: string
  statusLabel?: string
  generatedBy?: string
}

const STATUS_ORDER: StatusPresensi[] = ['HADIR', 'TERLAMBAT', 'IZIN', 'SAKIT', 'ALFA']

const BLUE_DARK = '08519C'
const BLUE_MID = '3182BD'
const BLUE_LIGHT = '9ECAE1'
const BLUE_BG = 'C6DBEF'
const GRAY_BORDER = 'BDBDBD'
const GRAY_LIGHT = 'F5F5F5'
const WHITE = 'FFFFFF'

function formatDate(date: string | Date) {
  return new Date(date).toLocaleDateString('id-ID', {
    day: '2-digit', month: 'long', year: 'numeric',
  })
}

function formatDateShort(date: string | Date) {
  return new Date(date).toLocaleDateString('id-ID', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  })
}

function formatTime(date?: string | Date | null) {
  if (!date) return '-'
  return new Date(date).toLocaleTimeString('id-ID', {
    hour: '2-digit', minute: '2-digit',
  })
}

function toMonthKey(value: string) {
  const [year, month] = value.split('-')
  return `${year}-${month}`
}

function isSingleMonthRange(start?: string, end?: string) {
  if (!start || !end) return false
  return toMonthKey(start) === toMonthKey(end)
}

const HEADER_STYLE: Partial<XLSX.CellStyle> = {
  font: { bold: true, color: { rgb: WHITE }, sz: 11, name: 'Calibri' },
  fill: { fgColor: { rgb: BLUE_DARK } },
  alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
  border: {
    top: { style: 'thin', color: { rgb: BLUE_LIGHT } },
    bottom: { style: 'thin', color: { rgb: BLUE_LIGHT } },
    left: { style: 'thin', color: { rgb: BLUE_LIGHT } },
    right: { style: 'thin', color: { rgb: BLUE_LIGHT } },
  },
}

const TITLE_STYLE: Partial<XLSX.CellStyle> = {
  font: { bold: true, color: { rgb: BLUE_DARK }, sz: 14, name: 'Calibri' },
  alignment: { horizontal: 'left', vertical: 'center' },
}

const SUBTITLE_STYLE: Partial<XLSX.CellStyle> = {
  font: { color: { rgb: BLUE_MID }, sz: 10, name: 'Calibri' },
  alignment: { horizontal: 'left', vertical: 'center' },
}

const LABEL_STYLE: Partial<XLSX.CellStyle> = {
  font: { bold: true, color: { rgb: BLUE_DARK }, sz: 10, name: 'Calibri' },
  alignment: { horizontal: 'left', vertical: 'center' },
  border: {
    top: { style: 'thin', color: { rgb: GRAY_BORDER } },
    bottom: { style: 'thin', color: { rgb: GRAY_BORDER } },
    left: { style: 'thin', color: { rgb: GRAY_BORDER } },
    right: { style: 'thin', color: { rgb: GRAY_BORDER } },
  },
}

const VALUE_STYLE: Partial<XLSX.CellStyle> = {
  font: { sz: 10, name: 'Calibri' },
  alignment: { horizontal: 'left', vertical: 'center' },
  border: {
    top: { style: 'thin', color: { rgb: GRAY_BORDER } },
    bottom: { style: 'thin', color: { rgb: GRAY_BORDER } },
    left: { style: 'thin', color: { rgb: GRAY_BORDER } },
    right: { style: 'thin', color: { rgb: GRAY_BORDER } },
  },
}

const CELL_STYLE: Partial<XLSX.CellStyle> = {
  font: { sz: 10, name: 'Calibri' },
  alignment: { horizontal: 'center', vertical: 'center' },
  border: {
    top: { style: 'thin', color: { rgb: GRAY_BORDER } },
    bottom: { style: 'thin', color: { rgb: GRAY_BORDER } },
    left: { style: 'thin', color: { rgb: GRAY_BORDER } },
    right: { style: 'thin', color: { rgb: GRAY_BORDER } },
  },
}

const ALT_ROW_STYLE: Partial<XLSX.CellStyle> = {
  ...CELL_STYLE,
  fill: { fgColor: { rgb: GRAY_LIGHT } },
}

function sv(v: any, style?: Partial<XLSX.CellStyle>): XLSX.CellObject {
  return { t: typeof v === 'number' ? 'n' : 's', v, s: style || CELL_STYLE }
}

function mergeStyles(base: Partial<XLSX.CellStyle>, overrides: Partial<XLSX.CellStyle>): Partial<XLSX.CellStyle> {
  return {
    ...base,
    font: { ...base.font, ...overrides.font },
    fill: { ...base.fill, ...overrides.fill },
    alignment: { ...base.alignment, ...overrides.alignment },
    border: { ...base.border, ...overrides.border },
  }
}

function buildInfoBlock(filters: ExportFilters) {
  return [
    [sv('LAPORAN ABSENSI SISWA', TITLE_STYLE)],
    [sv(`${filters.kelasLabel || 'Semua Kelas'} | ${filters.statusLabel || 'Semua Status'}`, SUBTITLE_STYLE)],
    [sv('')],
    [sv('Kelas', LABEL_STYLE), sv(filters.kelasLabel || 'Semua Kelas', VALUE_STYLE)],
    [sv('Periode', LABEL_STYLE), sv(`${filters.tanggalMulai || '-'} s/d ${filters.tanggalSelesai || '-'}`, VALUE_STYLE)],
    [sv('Status', LABEL_STYLE), sv(filters.statusLabel || 'Semua Status', VALUE_STYLE)],
    [sv('Dicetak Oleh', LABEL_STYLE), sv(filters.generatedBy || '-', VALUE_STYLE)],
    [sv('Waktu Cetak', LABEL_STYLE), sv(new Date().toLocaleString('id-ID'), VALUE_STYLE)],
    [sv('')],
  ]
}

function buildSummaryRows(data: LaporanRecord[]) {
  const counts = STATUS_ORDER.reduce<Record<StatusPresensi, number>>((acc, status) => {
    acc[status] = data.filter((item) => item.status === status).length
    return acc
  }, {} as Record<StatusPresensi, number>)

  const headerRow = [sv('Ringkasan', HEADER_STYLE), sv('Jumlah', HEADER_STYLE)]
  const dataRows = [
    [sv('Total Data', mergeStyles(CELL_STYLE, { font: { bold: true } })), sv(data.length, CELL_STYLE)],
    ...STATUS_ORDER.map((status, i) => [
      sv(STATUS_LABELS[status], i % 2 === 0 ? ALT_ROW_STYLE : CELL_STYLE),
      sv(counts[status], i % 2 === 0 ? ALT_ROW_STYLE : CELL_STYLE),
    ]),
  ]

  return { rows: [headerRow, ...dataRows], cols: [{ wch: 20 }, { wch: 14 }] }
}

function buildDetailRows(data: LaporanRecord[]) {
  const headers = ['No', 'Tanggal', 'NIS', 'Nama', 'Kelas', 'Status', 'Jam Datang', 'Keterangan']
  const headerRow = headers.map((h) => sv(h, HEADER_STYLE))

  const dataRows = data.map((item, index) => [
    sv(index + 1, CELL_STYLE),
    sv(formatDateShort(item.tanggal), CELL_STYLE),
    sv(item.siswa?.nis || '-', CELL_STYLE),
    sv(item.siswa?.nama || '-', mergeStyles(CELL_STYLE, { alignment: { horizontal: 'left' } })),
    sv(item.siswa?.kelas?.nama || '-', CELL_STYLE),
    sv(STATUS_LABELS[item.status], CELL_STYLE),
    sv(formatTime(item.jamDatang), CELL_STYLE),
    sv(item.keterangan || '-', mergeStyles(CELL_STYLE, { alignment: { horizontal: 'left' } })),
  ])

  return { rows: [headerRow, ...dataRows], cols: [{ wch: 6 }, { wch: 14 }, { wch: 12 }, { wch: 24 }, { wch: 12 }, { wch: 14 }, { wch: 12 }, { wch: 24 }] }
}

function buildRecapRows(data: LaporanRecord[]) {
  const grouped = new Map<string, {
    nis: string; nama: string; kelas: string
    counts: Record<StatusPresensi, number>
    latestDate?: string | Date
  }>()

  data.forEach((item) => {
    const nis = item.siswa?.nis || '-'
    const nama = item.siswa?.nama || '-'
    const kelas = item.siswa?.kelas?.nama || '-'
    const key = `${nis}-${nama}-${kelas}`

    if (!grouped.has(key)) {
      grouped.set(key, {
        nis, nama, kelas,
        counts: { HADIR: 0, TERLAMBAT: 0, IZIN: 0, SAKIT: 0, ALFA: 0 },
      })
    }

    const student = grouped.get(key)!
    student.counts[item.status] += 1
    if (!student.latestDate || new Date(item.tanggal) > new Date(student.latestDate)) {
      student.latestDate = item.tanggal
    }
  })

  const headers = ['No', 'NIS', 'Nama', 'Kelas', 'Hadir', 'Terlambat', 'Izin', 'Sakit', 'Alfa', 'Total', 'Terakhir']
  const headerRow = headers.map((h) => sv(h, HEADER_STYLE))

  const students = Array.from(grouped.values())
    .sort((a, b) => a.kelas.localeCompare(b.kelas) || a.nama.localeCompare(b.nama))

  const dataRows = students.map((student, index) => [
    sv(index + 1, CELL_STYLE),
    sv(student.nis, CELL_STYLE),
    sv(student.nama, mergeStyles(CELL_STYLE, { alignment: { horizontal: 'left' } })),
    sv(student.kelas, CELL_STYLE),
    sv(student.counts.HADIR, CELL_STYLE),
    sv(student.counts.TERLAMBAT, CELL_STYLE),
    sv(student.counts.IZIN, CELL_STYLE),
    sv(student.counts.SAKIT, CELL_STYLE),
    sv(student.counts.ALFA, CELL_STYLE),
    sv(Object.values(student.counts).reduce((s, v) => s + v, 0), mergeStyles(CELL_STYLE, { font: { bold: true } })),
    sv(student.latestDate ? formatDateShort(student.latestDate) : '-', CELL_STYLE),
  ])

  return { rows: [headerRow, ...dataRows], cols: [{ wch: 6 }, { wch: 12 }, { wch: 24 }, { wch: 12 }, { wch: 8 }, { wch: 12 }, { wch: 8 }, { wch: 8 }, { wch: 8 }, { wch: 8 }, { wch: 14 }] }
}

function buildMatrixRows(data: LaporanRecord[]) {
  const sortedDates = Array.from(new Set(data.map((item) => new Date(item.tanggal).toISOString().slice(0, 10))))
    .sort()

  const grouped = new Map<string, Record<string, string | number>>()

  data.forEach((item) => {
    const nis = item.siswa?.nis || '-'
    const nama = item.siswa?.nama || '-'
    const kelas = item.siswa?.kelas?.nama || '-'
    const key = `${nis}-${nama}-${kelas}`

    if (!grouped.has(key)) {
      grouped.set(key, { NIS: nis, Nama: nama, Kelas: kelas })
    }

    const row = grouped.get(key)!
    row[new Date(item.tanggal).toISOString().slice(0, 10)] = STATUS_LABELS[item.status]
  })

  const dayHeaders = sortedDates.map((d) => String(Number(d.slice(-2))).padStart(2, '0'))
  const headers = ['No', 'NIS', 'Nama', 'Kelas', ...dayHeaders]
  const headerRow = headers.map((h) => sv(h, HEADER_STYLE))

  const entries = Array.from(grouped.values())
    .sort((a, b) => String(a.Kelas).localeCompare(String(b.Kelas)) || String(a.Nama).localeCompare(String(b.Nama)))

  const dataRows = entries.map((row, index) => {
    const cells = [
      sv(index + 1, CELL_STYLE),
      sv(row.NIS, CELL_STYLE),
      sv(row.Nama, mergeStyles(CELL_STYLE, { alignment: { horizontal: 'left' } })),
      sv(row.Kelas, CELL_STYLE),
    ]

    sortedDates.forEach((dateKey) => {
      const day = Number(dateKey.slice(-2))
      const label = String(day).padStart(2, '0')
      const status = row[dateKey] as string | undefined
      cells.push(sv(status || '-', CELL_STYLE))
    })

    return cells
  })

  const cols = [{ wch: 6 }, { wch: 12 }, { wch: 24 }, { wch: 12 }, ...sortedDates.map(() => ({ wch: 10 }))]
  return { rows: [headerRow, ...dataRows], cols }
}

function createStyledSheet(rows: XLSX.CellObject[][], cols: XLSX.ColInfo[]): XLSX.WorkSheet {
  const sheet = XLSX.utils.aoa_to_sheet(rows)
  sheet['!cols'] = cols
  return sheet
}

export function exportLaporanToExcel(data: LaporanRecord[], filters: ExportFilters) {
  const workbook = XLSX.utils.book_new()

  const infoBlock = buildInfoBlock(filters)
  const summary = buildSummaryRows(data)
  const summarySheet = createStyledSheet([...infoBlock, ...summary.rows], summary.cols)
  XLSX.utils.book_append_sheet(workbook, summarySheet, 'Ringkasan')

  const detail = buildDetailRows(data)
  const detailSheet = createStyledSheet(detail.rows, detail.cols)
  XLSX.utils.book_append_sheet(workbook, detailSheet, 'List Harian')

  const recap = buildRecapRows(data)
  const recapSheet = createStyledSheet(recap.rows, recap.cols)
  XLSX.utils.book_append_sheet(workbook, recapSheet, 'Rekap Siswa')

  if (isSingleMonthRange(filters.tanggalMulai, filters.tanggalSelesai)) {
    const matrix = buildMatrixRows(data)
    if (matrix.rows.length > 1) {
      const matrixSheet = createStyledSheet(matrix.rows, matrix.cols)
      XLSX.utils.book_append_sheet(workbook, matrixSheet, 'Matriks Bulanan')
    }
  }

  const start = filters.tanggalMulai || 'semua'
  const end = filters.tanggalSelesai || 'semua'
  XLSX.writeFile(workbook, `Laporan_Absensi_${start}_${end}.xlsx`)
}

export function exportLaporanToPdf(data: LaporanRecord[], filters: ExportFilters) {
  const doc = new jsPDF('landscape', 'mm', 'a4')

  doc.setFontSize(16)
  doc.setTextColor(8, 81, 156)
  doc.text('LAPORAN ABSENSI SISWA', 14, 18)

  doc.setFontSize(10)
  doc.setTextColor(49, 130, 189)
  doc.text(`${filters.kelasLabel || 'Semua Kelas'} | ${filters.statusLabel || 'Semua Status'}`, 14, 25)

  doc.setFontSize(8)
  doc.setTextColor(100, 100, 100)
  doc.text(`Periode: ${filters.tanggalMulai || '-'} s/d ${filters.tanggalSelesai || '-'}`, 14, 30)
  doc.text(`Dicetak oleh: ${filters.generatedBy || '-'}`, doc.internal.pageSize.width - 14, 30, { align: 'right' })

  const headers = [['No', 'Tanggal', 'NIS', 'Nama', 'Kelas', 'Status', 'Jam Datang', 'Keterangan']]
  const rows = data.map((item, i) => [
    String(i + 1),
    formatDate(item.tanggal),
    item.siswa?.nis || '-',
    item.siswa?.nama || '-',
    item.siswa?.kelas?.nama || '-',
    STATUS_LABELS[item.status],
    formatTime(item.jamDatang),
    item.keterangan || '-',
  ])

  autoTable(doc, {
    head: headers,
    body: rows,
    startY: 34,
    styles: {
      fontSize: 7,
      cellPadding: 2,
      lineColor: [189, 189, 189],
      lineWidth: 0.1,
    },
    headStyles: {
      fillColor: [8, 81, 156],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      halign: 'center',
    },
    columnStyles: {
      0: { cellWidth: 8, halign: 'center' },
      1: { cellWidth: 28, halign: 'center' },
      2: { cellWidth: 22, halign: 'center' },
      3: { cellWidth: 50 },
      4: { cellWidth: 22, halign: 'center' },
      5: { cellWidth: 20, halign: 'center' },
      6: { cellWidth: 18, halign: 'center' },
      7: { cellWidth: 40 },
    },
    alternateRowStyles: {
      fillColor: [245, 245, 245],
    },
    margin: { top: 34, bottom: 10 },
    didDrawPage: (data: any) => {
      doc.setFontSize(7)
      doc.setTextColor(150, 150, 150)
      doc.text(
        `Halaman ${data.pageNumber}`,
        doc.internal.pageSize.width / 2,
        doc.internal.pageSize.height - 8,
        { align: 'center' },
      )
    },
  })

  const start = filters.tanggalMulai || 'semua'
  const end = filters.tanggalSelesai || 'semua'
  doc.save(`Laporan_Absensi_${start}_${end}.pdf`)
}
