import { NextFunction, Request, Response, Router } from 'express'
import { verifyAuthToken } from 'src/libs/jwt'
import userRepo from 'src/repos/user'

// export default class BaseController {
//   public router: Router

//   constructor() {
//     this.router = Router()
//   }

//   protected _showRoutes() {
//     let routePaths = []
//     this.router.stack.forEach((stack: any) => {
//       routePaths.push({
//         controller: this.constructor.name,
//         path: stack.route?.path,
//         method: (stack.route?.stack[0]?.method).toUpperCase()
//       })
//     })
//     console.table(routePaths, ['controller', 'method', 'path'])
//   }

//   protected _auth = async (req: Request, res: Response, next: NextFunction) => {
//     let token = req.body.token || req.query.token || req.headers['authorization'] || req.headers['x-access-token']

//     if (!token) {
//       res.status(403).send('Unauthorized!')
//       return
//     }
//     if (token.toLowerCase().startsWith('bearer')) {
//       token = token.slice('bearer'.length).trim()
//     }
//     // console.log('token :', token)
//     try {
//       // const decoded = verifyToken(token)
//       const decoded = await verifyAuthToken(token)
//       if (!decoded) {
//         res.status(403).send('Invalid Token!')
//         return
//       }
//       // const decoded = await verifyAccessToken(token)
//       const exists = await userExists(decoded.aud)
//       if (!exists) {
//         res.status(401).send('Invalid Token!')
//         return
//       }
//       req.user = decoded.aud
//       // const userAgent = req.useragent
//       // console.log('userAgent :', userAgent.source)
//     } catch (err) {
//       // console.log('verify ERROR :\n', err)
//       res.status(401).send('Invalid Token!')
//       return
//     }
//     next()
//   }

//   protected _ensurePermissions = (scopes: string[]) => async (req: Request, res: Response, next: NextFunction) => {
//     console.log('scopes :', scopes)
//     const passedKey = req.headers['x-api-key'] as string
//     if (passedKey.length < 8) {
//       res.status(401).send({ message: 'Invalid key', code: 401 })
//       return
//     }
//     try {
//       console.log('passedKey :', passedKey)
//       // do stuff here
//       return next()
//     } catch (err) {
//       console.log(err)
//       res.status(401).send({ message: 'Invalid key', code: 401 })
//       return
//     }
//   }
// }

export default abstract class BaseController {
  public router: Router

  constructor() {
    this.router = Router()
  }

  abstract configureRoutes(): void

  public showRoutes() {
    let routePaths = []
    this.router.stack.forEach((stack: any) => {
      routePaths.push({
        controller: this.constructor.name,
        path: stack.route?.path,
        method: (stack.route?.stack[0]?.method).toUpperCase()
      })
    })
    console.table(routePaths, ['controller', 'method', 'path'])
  }

  protected isAuth = (scopes: string[]) => async (req: Request, res: Response, next: NextFunction) => {
    let token = req.body?.token || req.query?.token || req.headers['authorization'] || req.headers['x-access-token']

    if (!token) {
      res.status(403).send('Unauthorized!')
      return
    }
    if (token.toLowerCase().startsWith('bearer')) {
      token = token.slice('bearer'.length).trim()
    }
    // console.log('token :', token)
    try {
      // const decoded = verifyToken(token)
      const decoded = await verifyAuthToken(token)
      if (!decoded) {
        res.status(403).send('Invalid Token!')
        return
      }
      // const decoded = await verifyAccessToken(token)
      // console.log('res.locals?.provider_id :', res.locals?.provider_id)
      const exists = await userRepo.isExists(decoded.aud)

      if (!exists) {
        res.status(401).send('Invalid Token!')
        return
      }

      /**
       * Authorization scopes check
       */
      if (scopes?.length) {
        const userScopes = decoded.scopes
        const hasPrivillageScopes = scopes.filter((scope) => userScopes.includes(scope?.toUpperCase())).length || 0
        // console.log('privillageScopes :', privillageScopes, userScopes, scopes)
        if (!hasPrivillageScopes) {
          res.status(401).send('Invalid Token!')
          return
        }
      }

      req.user = decoded.aud
      // const userAgent = req.useragent
      // console.log('userAgent :', userAgent.source)
    } catch (err) {
      // console.log('verify ERROR :\n', err)
      res.status(401).send('Invalid Token!')
      return
    }
    next()
  }
}
