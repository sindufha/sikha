# Sikha

Sikha adalah aplikasi presensi berbasis QR untuk admin, guru, dan siswa.

## Requirements

- Node.js 20+
- PostgreSQL
- npm

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
