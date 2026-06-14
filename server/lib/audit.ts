import { AksiAudit, Prisma } from '@prisma/client'
import prisma from './prisma'
import type { Request } from 'express'

export async function catatAudit(params: {
  aksi: AksiAudit
  userId?: string
  deskripsi?: string
  detail?: Prisma.InputJsonValue
  req?: Request
}) {
  try {
    const { aksi, userId, deskripsi, detail, req } = params
    await prisma.auditLog.create({
      data: {
        aksi,
        userId: userId || null,
        deskripsi: deskripsi || null,
        detail: detail ?? Prisma.DbNull,
        ip: req?.ip || req?.socket?.remoteAddress || null,
        userAgent: req?.headers?.['user-agent'] || null,
      },
    })
  } catch (error) {
    console.error('Audit log error:', error)
  }
}
