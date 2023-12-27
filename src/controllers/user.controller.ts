import { hash } from 'bcrypt'
import { NextFunction, Request, Response } from 'express'
import { emailReg, genHateoas } from 'src/libs'
import activity from 'src/repos/activity'
import userRepo from 'src/repos/user'
import { EmptyType, ErrorType, UserActivationType } from 'src/types/custom'
import { APP_ENV } from '..'
import BaseController from './base.controller'

class UserController extends BaseController {
  constructor() {
    super()
    this.configureRoutes()
  }

  /**
   * Get list of users
   */
  private getListOfUsers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const section = req.query?.list as UserActivationType
    const { _page } = req.query

    if (!['active', 'unactive', 'delete'].includes(section)) {
      res.status(400).send('Invalid url!')
      return
    }

    const page = Number(_page) || 1
    try {
      const total = await userRepo.getCount(section)
      const pages = Math.ceil(total / APP_ENV.ITEM_PER_PAGE)

      if (pages < page) {
        res.json({ data: [], page, pages })
        return
      }

      const users = await userRepo.getList(section, APP_ENV.ITEM_PER_PAGE, page)

      res.json({ data: users, page, pages })
    } catch (error) {
      next(error)
    }
  }

  /**
   * Get list of users
   */
  private getListOfSearchedUsers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const search = req.query?._search as string
    const section = req.query?.list as UserActivationType
    const { _page } = req.query

    if (!search || !['active', 'unactive', 'delete'].includes(section)) {
      res.status(400).send('Invalid search url!')
      return
    }

    const page = Number(_page) || 1
    try {
      const total = await userRepo.getSearchCount(search, section)
      const pages = Math.ceil(total / APP_ENV.ITEM_PER_PAGE)

      if (pages < page) {
        res.json({ data: [], page, pages })
        return
      }

      const users = await userRepo.getSearchList(search, section, APP_ENV.ITEM_PER_PAGE, page)

      res.json({ data: users, page, pages })
    } catch (error) {
      next(error)
    }
  }

  /**
   * Get user profile
   */
  private getUserProfile = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.params?.userId as string
      if (!userId) {
        res.status(400).send('User not found!')
        return
      }
      const profile = await userRepo.getProfile(userId)
      if (!profile) {
        res.status(400).send('User not found!')
        return
      }
      const _links = genHateoas(
        [
          { name: 'activity', link: 'activities' },
          { name: 'update user', method: 'patch' },
          { name: 'activation user', method: 'patch', link: 'activation' },
          { name: 'delete user', method: 'delete' }
        ],
        { req }
      )
      res.json({ id: userId, ...profile, _links })
    } catch (error) {
      next(error)
    }
  }

  /**
   * Update user details
   */
  private updateUserDetails = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const userId = req.params?.userId as string
    const err: ErrorType = {}
    const input: EmptyType = {}

    const { fullname, username, email, password, role } = req.body

    if (!userId) err.userId = 'UserId is required!'
    // 1st layer validation
    if (fullname && fullname.length < 4) err.fullname = 'Fullname at least 4 characters'
    if (username && username.length < 4) err.username = 'Username at least 4 characters'
    if (password && password.length < 8) err.password = 'Password should contains at least 8 characters'
    if (email && !emailReg.test(email)) err.email = 'Invalid email address!'

    if (role && !['USER', 'ADMIN'].includes(role)) err.role = 'Invalid Role!'

    // db check & it's called 3rd layer validation
    if (username && !err?.username) {
      const checkUsername = await userRepo.hasUnique(username, 'username')
      if (checkUsername) err.username = 'Username already taken!'
    }
    if (email && !err?.email) {
      const checkEmail = await userRepo.hasUnique(email, 'email')
      if (checkEmail) err.email = 'Email address already taken!'
    }

    if (Object.keys(err).length) {
      res.status(400).json(err)
      return
    }

    /**
     * Collect body data
     */
    if (fullname) input.fullname = fullname
    if (username) input.username = String(username)?.toLowerCase()
    if (email) input.email = String(email)?.toLowerCase()
    if (role) input.role = role
    if (password) {
      const hashedPassword = await hash(password, 12)
      input.password = hashedPassword
    }

    try {
      const patch = await userRepo.patch(input, userId)
      res.status(patch ? 200 : 400).send(patch ? 'User updated.' : 'User not update!')
    } catch (error) {
      next(error)
    }
  }

  /**
   * Patch user activation
   */
  private updateUserActivation = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const userId = req.params?.userId as string
    const action = req.body?.action as string

    const err: ErrorType = {}

    if (!userId) err.userId = 'UserId is required!'

    if (!['active', 'unactive'].includes(action)) err.action = 'Invalid action!'

    if (Object.keys(err).length) {
      res.status(400).json(err)
      return
    }

    try {
      const patch = await userRepo.patchActivation(userId, action)
      if ((action === 'active' && patch.isActive) || (action === 'unactive' && !patch.isActive)) {
        res.send('User activation updated.')
        return
      }
      res.status(400).send('User activation not update!')
    } catch (error) {
      next(error)
    }
  }

  /**
   * Delete user
   */
  private deleteUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const userId = req.params?.userId as string

    if (!userId) {
      res.status(400).send('UserId is required!')
      return
    }

    try {
      const del = await userRepo.delete(userId)
      res.status(del ? 200 : 400).send(del ? 'User has been removed.' : 'User not delete!')
    } catch (error) {
      next(error)
    }
  }

  /**
   * Get any authorized user profile
   */
  private profile = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user
      const profile = await userRepo.getProfile(userId)
      const _links = genHateoas([{ name: 'activity', link: 'activities' }], { req })
      res.json({ id: userId, ...profile, _links })
    } catch (error) {
      next(error)
    }
  }

  /**
   * Get any authorized user account activities
   */
  private getActivities = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const userId = req.user
    try {
      const activities = await activity.getList(userId)
      res.json(activities)
    } catch (error) {
      next(error)
    }
  }

  /**
   * Get activities
   */
  private getActivityStatus = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const activities = await activity.getStatus()
      res.json(activities)
    } catch (error) {
      next(error)
    }
  }

  /**
   * configure router
   */
  public configureRoutes() {
    // auth user
    this.router.get('/profile', this.isAuth(['admin', 'user']), this.profile)
    this.router.get('/profile/activities', this.isAuth(['admin', 'user']), this.getActivities)
    // ADMIN
    this.router.get('/', this.isAuth(['admin']), this.getListOfUsers)
    this.router.get('/search', this.isAuth(['admin']), this.getListOfSearchedUsers)
    this.router.get('/active-status', this.isAuth(['admin']), this.getActivityStatus)

    this.router.get('/:userId', this.isAuth(['admin']), this.getUserProfile)
    this.router.patch('/:userId', this.isAuth(['admin']), this.updateUserDetails)
    this.router.patch('/:userId/activation', this.isAuth(['admin']), this.updateUserActivation)
    this.router.delete('/:userId', this.isAuth(['admin']), this.deleteUser)
    // this._showRoutes()
  }
}

export default new UserController()
