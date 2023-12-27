import { PrismaClient } from '@prisma/client'

const prismadb: PrismaClient = global.prismadb || new PrismaClient() //  without query logging
// const prismadb: PrismaClient = global.prismadb || new PrismaClient({ log: ['query'] }) // with query logging

if (process.env.NODE_ENV === 'production') global.prismadb = prismadb

export default prismadb
