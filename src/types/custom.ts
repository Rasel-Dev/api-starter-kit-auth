export type JWTType = {
  aud: string
  iat: number
  exp: number
  jti?: string
}
export type UserAuthReq = string
export type ErrorType = Record<string, string | boolean>
export type EmptyType = Record<string, string | boolean>

export type UserActivationType = 'active' | 'unactive' | 'delete'
