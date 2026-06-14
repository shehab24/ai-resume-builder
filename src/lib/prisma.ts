import { PrismaClient } from '@prisma/client'

// Force brand new client to reload generated schemas
export const prisma = new PrismaClient()

