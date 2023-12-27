import { UserAuthReq } from '../custom'

export global {
  namespace Express {
    export interface Request {
      user?: UserAuthReq
    }
  }
}
