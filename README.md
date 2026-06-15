# Sikha

Sikha adalah aplikasi presensi berbasis QR untuk admin, guru, dan siswa.

## Requirements

- Node.js 20+
- PostgreSQL
- npm

##Preview
<img width="1280" height="585" alt="{53121D02-CDE1-4D39-9763-CC5A01245F8E}" src="https://github.com/user-attachments/assets/337669fa-9fcd-42b6-adf7-49f6e5b8de1a" />
<br>
<img width="1280" height="581" alt="{7BF9294C-301D-4817-8B38-685D64F350A6}" src="https://github.com/user-attachments/assets/efe67259-85c7-4686-aa51-ec4782359953" />

## Install

```bash
npm install
```

## Environment

Salin `.env.example` menjadi `.env`, lalu isi nilai yang sesuai:

```bash
cp .env.example .env
```

Pastikan `.env` tidak di-commit karena berisi kredensial database dan secret aplikasi.

## Development

```bash
npm run dev
```

## Build

```bash
npm run build
```

## Database

Generate Prisma client:

```bash
npm run db:generate
```

Push schema ke database development:

```bash
npm run db:push
```

Seed data awal jika diperlukan:

```bash
npm run db:seed
```
