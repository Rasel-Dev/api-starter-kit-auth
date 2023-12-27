import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()
async function main() {
  const users = await prisma.users.createMany({
    data: [
      {
        user_id: '38654b40-7256-4d52-88d6-0217970d7232',
        fullname: 'Ferry',
        username: 'conroy_706996',
        email: 'cassin.cb4d3fbe4282@hotmail.com',
        hashedPassword: '$2b$12$LW7buXNO2udypi3xBMyx0.hkW0pj.R1BCLCCUJM5Zg.12LcF8OPtS',
        role: 'ADMIN'
      },
      {
        user_id: '71b866e7-f98a-4210-bc8f-284863f1f4a8',
        fullname: 'Bode',
        username: 'garcia_867994',
        email: 'raseldeveloper2@gmail.com',
        hashedPassword: '$2b$12$zVAq6TVLU03jHTFjGIOz0OW89JM4qw4klg1iFmmAcQa26s04ws1cC'
      },
      {
        user_id: 'c63c4e2a-5b9a-462c-a8ee-6a09c7c737d3',
        fullname: 'Borer',
        username: 'crooks_953811',
        email: 'collier.b6ec4ae2e43b@hotmail.com',
        hashedPassword: '$2b$12$rosNILxL4NfGSVHZAxR3IemY1PI7JPllA911h08ul2T9G28Z2BF2q'
      }
    ]
  })

  console.log({ users })
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
