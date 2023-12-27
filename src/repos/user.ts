import { Prisma, users } from '@prisma/client'
import { DefaultArgs } from '@prisma/client/runtime/library'
import datekit from 'datekit'
import prismadb from 'src/libs/prismadb'
import { UserActivationType } from 'src/types/custom'

class UserRepo {
  private user: Prisma.usersDelegate<DefaultArgs>
  constructor() {
    this.user = prismadb.users
  }

  /**
   * Check unique username/email
   * @param input This should be username or email address
   * @param
   */
  public hasUnique(input: string, filterBy: 'username' | 'email' = 'username') {
    if (!['username', 'email'].includes(filterBy)) {
      return null
    }
    return filterBy === 'username'
      ? this.user.findFirst({
          select: {
            user_id: true,
            email: true
          },
          where: {
            username: input?.toLowerCase(),
            deletedAt: null
          }
        })
      : this.user.findFirst({
          select: { user_id: true },
          where: {
            email: input?.toLowerCase(),
            deletedAt: null
          }
        })
  }

  /**
   * Check userId exist or not
   * @param user_id string
   */
  public isExists(user_id: string) {
    return this.user.findFirst({
      select: { user_id: true },
      where: {
        user_id,
        isActive: true,
        deletedAt: null
      }
    })
  }

  /**
   * This will save the new user
   * @param body This should be object of user info
   * E.g. : 'fullname' | 'username' | 'email' | 'role' | 'hashedPassword'
   * @param user_agent Not mendatory
   */
  public save(body: Pick<users, 'fullname' | 'username' | 'email' | 'role' | 'hashedPassword'>, user_agent?: string) {
    return this.user.create({
      data: {
        ...body,
        user_activities: {
          create: {
            action: 'register',
            user_agent
          }
        }
      },
      select: {
        user_id: true,
        role: true
      }
    })
  }

  /**
   * This method used to get login information
   * @param input This input should be username or email
   * @param filterBy Default: 'both', Options: 'username' | 'email' | 'both'
   */
  public getIdentify(input: string, withEmail = false, filterBy: 'username' | 'email' | 'both' = 'both') {
    const userInput = input?.toLowerCase()
    const select = { user_id: true, email: true, hashedPassword: true }
    let where: any = { isActive: true, deletedAt: null, OR: [{ username: userInput }, { email: userInput }] }

    if (withEmail) delete select.email
    if (filterBy === 'username') where = { isActive: true, deletedAt: null, username: userInput }
    if (filterBy === 'email') where = { isActive: true, deletedAt: null, email: userInput }

    return this.user.findFirst({ select, where })
  }

  /**
   * Get user information
   * @param user_id string
   */
  public getProfile(user_id: string) {
    return this.user.findFirst({
      where: {
        user_id
      },
      select: {
        fullname: true,
        username: true,
        email: true,
        avater: true,
        role: true,
        createdAt: true
      }
    })
  }

  /**
   * Get count of users
   * @param section 'active' | 'unactive' | 'delete'
   */
  public getCount(section: UserActivationType = 'active') {
    const where: any | Record<string, boolean | null> = {}
    if (section === 'active') {
      where.isActive = true
      where.deletedAt = null
    }
    if (section === 'unactive') {
      where.isActive = false
      where.deletedAt = null
    }
    if (section === 'delete') {
      where.isActive = false
      where.NOT = { deletedAt: null }
    }

    return this.user.count({ where })
  }

  /**
   * Get list of users
   * @param section 'active' | 'unactive' | 'delete'
   * @param take number of item to get
   * @param page number of page
   */
  public getList(section: UserActivationType = 'active', take: number, page = 1) {
    const where: any | Record<string, boolean | null> = {}
    if (section === 'active') {
      where.isActive = true
      where.deletedAt = null
    }
    if (section === 'unactive') {
      where.isActive = false
      where.deletedAt = null
    }
    if (section === 'delete') {
      where.isActive = false
      where.NOT = { deletedAt: null }
    }

    return this.user.findMany({
      where,
      take,
      skip: page === 1 ? 0 : take * page,
      select: {
        user_id: true,
        fullname: true,
        username: true,
        email: true,
        avater: true,
        role: true,
        createdAt: true,
        updatedAt: true
      }
    })
  }

  /**
   * Get count of search users
   * @param search 'fullname' | 'username' | 'email'
   * @param section 'active' | 'unactive' | 'delete'
   */
  public getSearchCount(search: string, section: UserActivationType = 'active') {
    const where: any | Record<string, boolean | null> = {}
    if (section === 'active') {
      where.isActive = true
      where.deletedAt = null
    }
    if (section === 'unactive') {
      where.isActive = false
      where.deletedAt = null
    }
    if (section === 'delete') {
      where.isActive = false
      where.NOT = { deletedAt: null }
    }

    return this.user.count({
      where: {
        ...where,
        OR: [
          { fullname: { startsWith: search } },
          { username: { startsWith: search } },
          { email: { startsWith: search } }
        ]
      }
    })
  }

  /**
   * Get list of search users
   * @param search 'fullname' | 'username' | 'email'
   * @param section 'active' | 'unactive' | 'delete'
   * @param take number of item to get
   * @param page number of page
   */
  public getSearchList(search: string, section: UserActivationType = 'active', take: number, page = 1) {
    const where: any | Record<string, boolean | null> = {}
    if (section === 'active') {
      where.isActive = true
      where.deletedAt = null
    }
    if (section === 'unactive') {
      where.isActive = false
      where.deletedAt = null
    }
    if (section === 'delete') {
      where.isActive = false
      where.NOT = { deletedAt: null }
    }

    return this.user.findMany({
      where: {
        ...where,
        OR: [
          { fullname: { startsWith: search } },
          { username: { startsWith: search } },
          { email: { startsWith: search } }
        ]
      },
      take,
      skip: page === 1 ? 0 : take * page,
      select: {
        user_id: true,
        fullname: true,
        username: true,
        email: true,
        avater: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true
      }
    })
  }

  /**
   * Update user password or email address
   * @param input Should be email or hashedPassword
   * @param user_id Who changed
   * @param filterBy 'email' | 'hashedPwd'
   */
  public patchEmailOrPassword(input: string, user_id: string, filterBy: 'email' | 'hashedPwd') {
    const data = filterBy === 'hashedPwd' ? { hashedPassword: input } : { email: input?.toLowerCase() }
    return this.user.update({ where: { user_id }, data })
  }

  /**
   * Update user details
   * @param body Should be email or hashedPassword
   * @param user_id user Id to update
   */
  public patch(
    body: Partial<Pick<users, 'fullname' | 'username' | 'email' | 'role' | 'hashedPassword'>>,
    user_id: string
  ) {
    return this.user.update({ where: { user_id }, select: { user_id: true }, data: body })
  }

  /**
   * Patch user activation like: active, unactive, delete
   * @param user_id user id
   * @param action 'active' | 'unactive'
   */
  public patchActivation(user_id: string, action: Omit<UserActivationType, 'delete'>) {
    return this.user.update({
      data: {
        isActive: action === 'active',
        deletedAt: null
      },
      select: {
        isActive: true
      },
      where: {
        user_id
      }
    })
  }

  /**
   * User remove
   * @param user_id who's gonna removed
   */
  public delete(user_id: string) {
    return this.user.update({
      data: {
        isActive: false,
        deletedAt: new Date(datekit().getTime())
      },
      select: {
        isActive: true
      },
      where: {
        user_id
      }
    })
  }
}

export default new UserRepo()
