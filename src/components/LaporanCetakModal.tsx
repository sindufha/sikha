import { FileSpreadsheet, FileText, Printer } from 'lucide-react'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'

interface CetakModalProps {
  isOpen: boolean
  onClose: () => void
  onPdf: () => void
  onExcel: () => void
}

export default function LaporanCetakModal({ isOpen, onClose, onPdf, onExcel }: CetakModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Cetak Laporan" maxWidth="max-w-sm">
      <p className="text-sm text-text-secondary mb-4">Pilih format untuk mengexport laporan presensi</p>
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => { onPdf(); onClose() }}
          className="flex flex-col items-center gap-2 p-5 rounded-xl border border-border bg-white hover:bg-slate-50 hover:border-primary/30 transition-all cursor-pointer"
        >
          <div className="w-12 h-12 rounded-xl bg-error-bg flex items-center justify-center">
            <FileText className="w-6 h-6 text-error-text" />
          </div>
          <span className="text-sm font-semibold text-text">PDF</span>
          <span className="text-[11px] text-text-muted">Dokumen cetak</span>
        </button>
        <button
          onClick={() => { onExcel(); onClose() }}
          className="flex flex-col items-center gap-2 p-5 rounded-xl border border-border bg-white hover:bg-slate-50 hover:border-primary/30 transition-all cursor-pointer"
        >
          <div className="w-12 h-12 rounded-xl bg-success-bg flex items-center justify-center">
            <FileSpreadsheet className="w-6 h-6 text-success-text" />
          </div>
          <span className="text-sm font-semibold text-text">Excel</span>
          <span className="text-[11px] text-text-muted">Spreadsheet</span>
        </button>
      </div>
      <div className="mt-4">
        <Button onClick={onClose} variant="ghost" fullWidth size="sm">
          Batal
        </Button>
      </div>
    </Modal>
  )
}
