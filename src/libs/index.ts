import { genSalt, hash } from 'bcrypt'
import { Application, Request } from 'express'
import { verify } from 'jsonwebtoken'
import { JWTType } from 'src/types/custom'
import { v4 as uuidv4 } from 'uuid'

export const pwdReg = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])[0-9a-zA-Z]{8,}$/
export const emailReg =
  /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/

export const verifyToken = (token: string): JWTType => {
  const decode: unknown = verify(token, process.env?.JWT_SECRET)
  return decode as JWTType
}

export const randomToken = (length = 11) => {
  const alpha = 'abcdefghijklmnopqrstuvwxyz'
  const numaric = '0123456789'
  const special = '_-'

  const characters1 = alpha + alpha.toUpperCase() + numaric
  const characters2 = alpha + special + alpha.toUpperCase() + numaric
  let token = ''
  for (let i = 0; i < length; i++) {
    if (i === 0) {
      token += characters1.charAt(Math.floor(Math.random() * characters1.length))
    } else {
      token += characters2.charAt(Math.floor(Math.random() * characters2.length))
    }
  }
  return token.replace(/-$/, characters1.charAt(Math.floor(Math.random() * characters1.length)))
}

export const genApiKey = (len = 30) => {
  return [...Array(len)].map(() => ((Math.random() * 36) | 0).toString(36)).join('')
}

export const generateKeyMask = (key: string) => `${key.slice(0, 4)}...${key.slice(-4)}`

export const generateAPIKey = async () => {
  const key = uuidv4().replace(/-/g, '')
  console.log('api key generated (wont be shown again): ', key)
  const maskedKey = generateKeyMask(key)

  const salt = await genSalt(10)
  const encryptedKey = await hash(key, salt)
  return { encryptedKey, maskedKey, key }
}

export const validOrigin = (origins: string = '') => {
  const invalid: string[] = []
  const valid = origins
    .toString()
    .split(',')
    .map((o) => {
      const origin = o.replace(' ', '').trim()
      if (origin.endsWith('//') || origin.endsWith('://')) {
        invalid.push(origin)
        return null
      }
      if (origin.includes('@')) {
        invalid.push(origin)
        return null
      }
      if (origin.startsWith('http://') || origin.startsWith('https://')) {
        if (origin.endsWith('/') || origin.endsWith('.') || origin.endsWith(',')) return origin.slice(0, -1)
        return origin
      }
      if (origin) invalid.push(origin)
      return null
    })
    .filter((o) => o)
  return { valid, invalid }
}

export const routeLogs = (express: Application) => {
  // let routePaths = []
  const stacks = express._router?.stack
  // console.log('stacks :', stacks[stacks.length - 1]?.handle?.stack)
  console.log('-----------------------------------')
  stacks
    ?.filter((s) => s.name === 'router')
    .forEach((stack) => {
      const innerStacks = stack?.handle.stack
      if (stack && innerStacks) {
        innerStacks.forEach((inrStack) => {
          const { methods, path } = inrStack.route
          const method = Object.keys(methods)
          // console.log('methods, path :', stack.regexp, methods, path)
          console.log('http:', method[0].toUpperCase(), path)
          // routePaths.push(methods, path)
        })
        console.log('-----------------------------------')
      }
    })
}

type HateoasType = { name: string; link?: string; method?: string }
export const genHateoas = (links: HateoasType[], option: { req?: Request; customUrl?: string }) => {
  const _links: Record<string, string>[] = []
  const { req, customUrl } = option
  const uri = !!req ? req.originalUrl : customUrl
  // const keys = Object.keys(links)
  _links.push(
    { rel: 'self', method: 'get', href: uri },
    ...links.map((k) => ({ rel: k.name, method: k?.method || 'get', href: `${uri}${!!k.link ? `/${k.link}` : ``}` }))
  )
  return _links
}

// console.log('validOrigin :', validOrigin('https://localhost.live,http://localhost/,http://google.com.@'))
