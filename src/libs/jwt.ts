import datekit from 'datekit'
import { readFileSync, writeFileSync } from 'fs'
import { TokenExpiredError, verify } from 'jsonwebtoken'
import jwktopem from 'jwk-to-pem'
import jose from 'node-jose'
import { join } from 'path'
import { v4 as uuid } from 'uuid'
import { APP_ENV } from '..'

export interface TokenPayload {
  jti: string
  aud: string
  scopes: string[]
  iss?: string
}

export const genAuthToken = async (userId: string, scopes: string[] = [], issuer = APP_ENV.JWT_ISSUER) => {
  const ks = readFileSync(join('./public/.well-known/keys.json'))
  const keyStore = await jose.JWK.asKeyStore(ks.toString())
  const [key] = keyStore.all({ use: 'sig' })

  const d = datekit()
  const exp = d.plus(APP_ENV.JWT_ACCESS_TOKEN_EXP, 'minute').getTime()
  const exp2 = d.plus(APP_ENV.JWT_REFRESH_TOKEN_EXP, 'day').getTime()

  const opt = { compact: true, jwk: key, fields: { typ: 'jwt', iss: issuer } }
  // console.log('add({ min: APP_ENV.JWT_ACCESS_TOKEN_EXP }) :', add({ min: APP_ENV.JWT_ACCESS_TOKEN_EXP }))
  const accessPayload = JSON.stringify({
    jti: uuid(),
    exp, // for minutes
    iat: d.getTime(),
    scopes: [...scopes],
    aud: userId
  })
  const refreshPayload = JSON.stringify({
    jti: uuid(),
    exp: exp2, // for days
    iat: d.getTime(),
    scopes: [...scopes],
    aud: userId
  })
  const token = jose.JWS.createSign(opt, key).update(accessPayload)
  const token2 = jose.JWS.createSign(opt, key).update(refreshPayload)

  const [access, refresh] = await Promise.all([token.final(), token2.final()])
  return { accessToken: access + '', refreshToken: refresh + '' }
}
// ;(async () => {
//   const token = await genAuthToken('12388', [], 'https://yourdomain.com')
//   console.log('token :', token)
// })()

export const newJwk = async () => {
  try {
    const keyStore = jose.JWK.createKeyStore()
    await keyStore.generate('RSA', 2048, { alg: 'RS256', use: 'sig' })
    writeFileSync(join('./public/.well-known/keys.json'), JSON.stringify(keyStore.toJSON(true), null, '  '))
  } catch (error) {
    throw error
  }
}

export const jwkRotation = async () => {
  const ks = readFileSync(join('./public/.well-known/keys.json'))
  const keyStore = await jose.JWK.asKeyStore(ks.toString())
  await keyStore.generate('RSA', 2048, { alg: 'RS256', use: 'sig' })
  const json = keyStore.toJSON(true) as { keys: string[] }
  json.keys = json?.keys.reverse()
  writeFileSync(join('./public/.well-known/keys.json'), JSON.stringify(json, null, '  '))
  return keyStore.toJSON()
}

export const verifyAuthToken = async (token: string): Promise<TokenPayload | void> => {
  // const { data } = await axios.get('http://localhost:4040/jwks')
  const keyData = JSON.parse(readFileSync(join('./public/.well-known/keys.json'), 'utf-8'))
  const [firstKey] = keyData.keys
  const publicKey = jwktopem(firstKey)
  return new Promise((resolve, reject) => {
    try {
      const decoded = verify(token, publicKey)
      resolve(decoded as TokenPayload)
    } catch (e) {
      if (e instanceof TokenExpiredError) {
        if (e.name === 'TokenExpiredError') return resolve()
      }
      reject(e)
    }
  })
}
