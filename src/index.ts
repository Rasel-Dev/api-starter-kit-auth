import dotenv from 'dotenv'
import 'src/process'
import ExpressServer from './server'
dotenv.config()

export const APP_ENV = {
  // APP
  NODE_ENV: process.env?.NODE_ENV || 'development',
  APP_NAME: process.env?.APP_NAME || 'yourapp',
  APP_URI: process.env?.APP_URI || 'https://localhost:8000',
  AUTH_APP_URI: process.env?.AUTH_APP_URI || 'yourapp.com',
  APP_TIMEZONE: process.env?.TZ || 'Asia/Dhaka',
  PORT: +process.env?.PORT || 8000,
  // PAGINATION
  ITEM_PER_PAGE: 10,
  // CACHE
  SETTINGS_CACHE_TIME: 3600,
  MONTH_CACHE: 2592000,
  WEEK_CACHE: 604800,
  // REDIS
  REDIS_URI: process.env?.REDIS_URI || 'redis://127.0.0.1:6379',
  // MAIL
  MAIL_USER: process.env?.MAIL_USER || 'support@mail.com',
  MAIL_PASS: process.env?.MAIL_PASS || 'S3$f8#d3%p1@C6$l8%',
  // JWT
  JWT_ALGORITHM: 'HS256', // 'RS256'
  JWT_ISSUER: process.env?.JWT_ISSUER || 'https://standalone-auth.com',
  // JWT_AUDIENCE: process.env?.JWT_AUDIENCE || 'https://chatme.com',
  JWT_ACCESS_TOKEN_EXP: +process.env?.JWT_ACCESS_TOKEN_EXP || 15, // minutes
  JWT_REFRESH_TOKEN_EXP: +process.env?.JWT_REFRESH_TOKEN_EXP || 7, // days
  // KEYS
  JWT_ACCESS_PUB: process.env?.JWT_ACCESS_PUB,
  JWT_REFRESH_PUB: process.env?.JWT_REFRESH_PUB,
  JWT_ACCESS_PRIV: process.env?.JWT_ACCESS,
  JWT_REFRESH_PRIV: process.env?.JWT_REFRESH
}

// const keyGen = new RSAKey()
// keyGen.generate()

// redisClient.connect()
ExpressServer.start()

// console.log(randomToken(30))
// console.log(genApiKey(30))

/**
 * Generate self SSL Certificate
 */
// 1) openssl genrsa -out key.pem
// 2) openssl req -new -key key.pem -out csr.pem
// 3) openssl x509 -req -days 365 -in csr.pem -signkey key.pem -out cert.pem

/**
 * Generate public & private key for JWT
 */
// 1) ssh-keygen -t rsa -b 4096 -m PEM -f private.key
// 2) ssh-keygen -f private.key -e -m PKCS8 > public.key

// ;(async () => {
//   console.log('Start Executing...')
//   await execAsync('ssh-keygen -t rsa -b 4096 -m PEM -f ./keys/private.key && rm -rf ./keys/private.key.pub')
//   await execAsync('ssh-keygen -f ./keys/private.key -e -m PKCS8 > ./keys/public.key')
//   console.log('End Executed.*')
// })()

// const keyStore = jose.JWK.createKeyStore()
// keyStore.generate('RSA', 2048, { alg: 'RS256', use: 'sig' }).then(() => {
//   writeFileSync(join('./public/.well-known/keys.json'), JSON.stringify(keyStore.toJSON(true), null, '  '))
// })

// sendForMail()

// ActivityEvent.listen('info', (data) => {
//   console.log('info :', data)
// })
// ActivityEvent.listen('warn', (data) => {
//   console.log('warning :', data)
// })
// ActivityEvent.listen('error', (data) => {
//   console.log('error :', data)
// })
// const base64 =
//   'eyJmdWxsbmFtZSI6IkJvZGUiLCJ1c2VybmFtZSI6ImdhcmNpYV84Njc5OTQiLCJlbWFpbCI6InJhc2VsZGV2ZWxvcGVyMkBnbWFpbC5jb20iLCJhdmF0ZXIiOm51bGwsImNyZWF0ZWRBdCI6IjIwMjMtMTAtMjVUMTA6MDE6MDIuMTE5WiIsInJvbGUiOiJVU0VSIn0='

// // console.log('base64 :', base64.split(''))
// const unique: Record<string, string | number[]>[] = []

// for (let index = 0; index < base64.length; index++) {
//   const element = base64[index]
//   if (index === 0) {
//     unique.push({ field: element, p: [index] })
//   } else {
//     // check cherecter exists
//     const fidx = unique.findIndex((c) => c?.field === element)
//     if (fidx !== -1) {
//       const oldPos = unique[fidx]?.p as number[]
//       unique[fidx].p = [...oldPos, index]
//     } else {
//       unique.push({ field: element, p: [index] })
//     }
//   }
//   // console.log('element :', element)
// }
// const shortBase64 = unique.map((k) => k?.field).join('')
// console.log('unique :', unique)
// console.log('shortBase64 :', shortBase64)
// console.log('base64 :', base64)

// const part = base64.length / 4
// console.log('base64 :', base64.substring(0, part))

// const decode = Buffer.from(base64, 'base64').toString('utf-8')
// console.log('decode :', decode)
