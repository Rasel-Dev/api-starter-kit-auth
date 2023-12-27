import { compare, hash } from 'bcrypt'
import { NextFunction, Request, Response } from 'express'
import { readFileSync } from 'fs'
import { emailReg, verifyToken } from 'src/libs'
import { setAuthCookie } from 'src/libs/cookie'
import { genAuthToken, jwkRotation, verifyAuthToken } from 'src/libs/jwt'
import activityRepo from 'src/repos/activity'
import userRepo from 'src/repos/user'
import { ErrorType } from 'src/types/custom'
import BaseController from './base.controller'

import { Role } from '@prisma/client'
import { sign } from 'jsonwebtoken'
import jose from 'node-jose'
import resetRepo from 'src/repos/resetPassword'
import { APP_ENV } from '..'

class AuthController extends BaseController {
  constructor() {
    super()
    this.configureRoutes()
  }

  private register = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // TODO: Like a create random record
      const errors: ErrorType = {}
      const { fullname, username, email, password } = req.body
      // console.log('req.body :', req.body)
      // 1st layer validation
      if (!fullname) errors.fullname = 'Fullname is required!'
      if (!username) errors.username = 'Username is required!'
      if (!email) errors.email = 'Email address is required!'
      if (!password) errors.password = 'Password is required!'
      // 2nd layer validation
      if (!errors?.fullname && fullname.length < 4) errors.fullname = 'Fullname at least 4 characters'
      if (!errors?.username && username.length < 4) errors.username = 'Username at least 4 characters'
      if (!errors?.password && password.length < 8) errors.password = 'Password should contains at least 8 characters'
      if (!errors?.email && !emailReg.test(email)) errors.email = 'Invalid email address!'

      // db check & it's called 3rd layer validation
      if (!errors.username) {
        const checkUsername = await userRepo.hasUnique(username, 'username')
        if (checkUsername) errors.username = 'Username already taken!'
      }
      if (!errors.email) {
        const checkEmail = await userRepo.hasUnique(email, 'email')
        if (checkEmail) errors.email = 'Email address already taken!'
      }

      if (Object.keys(errors).length) {
        res.status(400).json(errors)
        return
      }
      // pass 'user' object to repository/service
      const hashedPassword = await hash(password, 12)
      // create new record and return with created "id"
      const user = await userRepo.save(
        {
          fullname,
          username: username?.toLowerCase(),
          email: email?.toLowerCase(),
          hashedPassword,
          role: Role.USER
        },
        req.useragent.source
      )

      // const [accessToken, refreshToken] = await Promise.all([
      //   signAccessToken(user?.user_id),
      //   signRefreshToken(user?.user_id)
      // ])
      const { accessToken, refreshToken } = await genAuthToken(user?.user_id, [user.role], 'https://yourdomain.com')
      // const token = sign({ aud: user?.user_id, iat: Math.floor(Date.now() / 1000) - 30 }, process.env?.JWT_SECRET, {
      //   expiresIn: '24h'
      // })
      // set token to response cookie
      setAuthCookie(refreshToken, res)
      // response the final data
      res.json({ id: user.user_id, fullname, username, email, token: accessToken })
    } catch (error: any) {
      next(error)
    }
  }

  private login = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { username, password } = req.body
      //validation
      if (!username || !password || (password && password.length < 8)) {
        res.status(400).json({ message: 'Incorrect login credentials!' })
        return
      }

      const user = await userRepo.getIdentify(username)
      if (!user) {
        res.status(400).json({ message: 'Incorrect login credentials!' })
        return
      }

      if (!(await compare(password, user.hashedPassword))) {
        res.status(400).json({ message: 'Incorrect login credentials!' })
        return
      }

      const { role, ...profile } = await userRepo.getProfile(user.user_id)

      const action = `login`
      const [{ accessToken, refreshToken }, lastActivity] = await Promise.all([
        // signAccessToken(user?.user_id, [], 'www.yourdomain.com'),
        // signRefreshToken(user?.user_id, [], 'www.yourdomain.com'),
        genAuthToken(user?.user_id, [role], 'https://yourdomain.com'),
        activityRepo.lastActivity(user.user_id, action)
      ])
      /**
       * Set Activity
       */
      // const lastActivity = await getLastActivity(user.user_id, action)
      await activityRepo.patch(user.user_id, action, req.useragent.source, req.ip, lastActivity?.user_activity_id)

      // const token = sign({ aud: user?.user_id, iat: Math.floor(Date.now() / 1000) - 30 }, process.env?.JWT_SECRET, {
      //   expiresIn: '24h'
      // })
      // set token to response cookie
      setAuthCookie(refreshToken, res)

      res.json({ id: user?.user_id, ...profile, token: accessToken })
    } catch (error) {
      next(error)
    }
  }

  private forget = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const errors: ErrorType = {}
    const { user } = req.body
    const action = `forgotPwd`
    let forgotUser: {
      email: string
      user_id: string
      hashedPassword: string
    } | null
    if (!user) errors.user = 'Username or Email address is required!'

    try {
      if (user && !errors.user) {
        forgotUser = await userRepo.getIdentify(user, true)
        if (!forgotUser) errors.user = 'Username or Email address is not really accosiated with this program!'
      }

      if (Object.keys(errors).length) {
        res.status(422).json(errors)
        return
      }
      let tokenId: string
      const lastActivity = await activityRepo.lastActivity(forgotUser.user_id, action)
      if (!lastActivity || lastActivity.frames <= 3) {
        const [resetTokenId] = await Promise.all([
          resetRepo.save(forgotUser.user_id, forgotUser.hashedPassword),
          activityRepo.patch(forgotUser.user_id, action, req.useragent.source, req.ip, lastActivity?.user_activity_id)
        ])
        tokenId = resetTokenId.reset_password_id
      } else {
        res.status(422).send('You reached 3 times forgot password within an hour! try next hour.')
        return
      }

      const token = sign({ aud: forgotUser.user_id, jti: tokenId }, process.env?.JWT_SECRET, { expiresIn: '2m' })
      /**
       * Send this token to Email or other services
       */
      //----------------
      const link = `${APP_ENV.APP_URI}/v1/auth/reset-password/${token}`
      res.send({ link, token })
    } catch (error) {
      next(error)
    }
  }

  private resetPassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const errors: ErrorType = {}
    const token = (req.body?.token || req.query?.token || req.headers['authorization']) as string
    const { new_password, confirm_password } = req.body
    const action = `resetPwd`

    if (!token) {
      next() // it should return "404 not found!"
      return
    }

    if (!new_password) errors.new_password = 'Password is required!'
    if (!errors?.new_password && new_password.length < 8)
      errors.new_password = 'Password should contains at least 8 characters'
    if (!errors?.new_password && new_password !== confirm_password)
      errors.confirm_password = 'Confirmation password not matched!'

    if (Object.keys(errors).length) {
      res.status(400).json(errors)
      return
    }

    try {
      const decoded = verifyToken(token)
      await resetRepo.verify(decoded?.jti)
      const lastActivity = await activityRepo.lastActivity(decoded.aud, action)
      if (!lastActivity || lastActivity.frames <= 3) {
        const [hashedPassword] = await Promise.all([
          hash(new_password, 12),
          activityRepo.patch(decoded.aud, action, req.useragent.source, req.ip, lastActivity?.user_activity_id),
          resetRepo.expire(decoded.jti)
        ])
        const patched = await userRepo.patchEmailOrPassword(hashedPassword, decoded.aud, 'hashedPwd')
        res.send(!!patched ? 'Password has been reset.' : 'Password not reset!')
      } else {
        res.status(422).send('You reached 3 time changes password within an hour! try next hour.')
        return
      }
    } catch (error) {
      res.status(422).send('Reset token has been expired!')
    }
  }

  private refreshToken = async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const { _token } = req.cookies
    const { token } = req.body
    const refToken: string = token || _token
    // console.log('refToken :', refToken)
    if (!refToken) {
      res.status(401).json({ message: 'Unauthorized' })
      return
    }
    try {
      const decode = await verifyAuthToken(refToken)
      if (!decode) {
        res.status(403).send('Invalid Token!')
        return
      }
      const exist = await userRepo.isExists(decode.aud)
      if (!exist) {
        res.status(403).send('Invalid Token!')
        return
      }
      const action = `refreshToken`
      const [{ accessToken, refreshToken }, lastActivity] = await Promise.all([
        // signAccessToken(aud),
        // signRefreshToken(aud),
        genAuthToken(decode.aud, decode.scopes, 'https://yourdomain.com'),
        activityRepo.lastActivity(decode.aud, action)
      ])
      setAuthCookie(refreshToken, res)
      /**
       * Set Activity
       */
      // const lastActivity = await getLastActivity(aud, action)
      await activityRepo.patch(decode.aud, action, req.useragent.source, req.ip, lastActivity?.user_activity_id)
      // apply new tokens
      res.status(200).json({ token: accessToken, refresh: refreshToken })
    } catch (error) {
      // next(error)
      res.status(403).send('Invalid Token!')
    }
  }

  private updateUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const errors: ErrorType = {}
      const userId = req.user
      const { section } = req.params

      switch (section) {
        case 'password': {
          const { old_password, new_password, confirm_password } = req.body
          // 1 # Requirements
          if (!old_password) errors.old_password = 'Old password is required!'
          if (!new_password) errors.new_password = 'New password is required!'
          if (!confirm_password) errors.confirm_password = 'Confirm password is required!'
          // 2 # Should be
          if (!errors?.new_password && new_password.length < 8)
            errors.new_password = 'Password should contains at least 8 characters!'
          if (!errors?.new_password && !errors?.old_password && old_password === new_password)
            errors.new_password = 'Try new password!'
          //
          if (Object.keys(errors).length) {
            res.status(400).json(errors)
            return
          }
          const hashedPassword = await hash(new_password, 12)
          const update = await userRepo.patchEmailOrPassword(hashedPassword, userId, 'hashedPwd')
          res.status(!!update ? 200 : 400).send({
            message: !!update ? 'Password changed.' : 'Password not changed!'
          })
          break
        }

        case 'email': {
          const { new_email } = req.body
          // 1 # Requirements
          if (!new_email) errors.new_email = 'Email is required!'
          if (!errors?.new_email && !emailReg.test(new_email)) errors.new_email = 'Invalid email address!'
          //
          if (Object.keys(errors).length) {
            res.status(400).json(errors)
            return
          }

          if (!errors.new_email) {
            const checkEmail = await userRepo.hasUnique(new_email, 'email')
            if (checkEmail) errors.new_email = 'Email address already taken!'
          }
          //
          if (Object.keys(errors).length) {
            res.status(400).json(errors)
            return
          }

          const update = await userRepo.patchEmailOrPassword(new_email, userId, 'email')
          res.status(!!update ? 200 : 400).send({
            message: !!update ? 'Email address changed.' : 'Email address not changed!'
          })
          break
        }

        default:
          next()
          return
      }
      /**
       * Set Activity
       */
      const action = `${section}Change`
      const lastActive = await activityRepo.lastActivity(userId, action)
      await activityRepo.patch(userId, action, req.useragent.source, req.ip, lastActive?.user_activity_id)
      // await newActivity(userId, action, req.useragent.source)
    } catch (error) {
      next(error)
    }
  }

  private getJwk = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const ks = readFileSync('public/.well-known/keys.json')
      const keyStore = await jose.JWK.asKeyStore(ks.toString())

      res.send(keyStore.toJSON())
    } catch (error) {
      next(error)
    }
  }

  private updateJwk = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const jwk = await jwkRotation()
      res.send(jwk)
    } catch (error) {
      next(error)
    }
  }

  /**
   * configure router
   */
  public configureRoutes() {
    // Json web key
    this.router.get('/jwk', this.getJwk)
    this.router.patch('/jwk', this.isAuth(['admin']), this.updateJwk)

    // Auth
    this.router.post('/signup', this.register)
    this.router.post('/signin', this.login)
    this.router.post('/forget-password', this.forget)
    this.router.post('/reset-password', this.resetPassword)
    this.router.post('/refresh', this.refreshToken)
    this.router.patch('/:section', this.isAuth(['admin', 'user']), this.updateUser)

    // this._showRoutes()
  }
}

// export default AuthController
export default new AuthController()
