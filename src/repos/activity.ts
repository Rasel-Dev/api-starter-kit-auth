import { Prisma } from '@prisma/client'
import { DefaultArgs } from '@prisma/client/runtime/library'
import datekit from 'datekit'
import prismadb from 'src/libs/prismadb'

class ActivityRepo {
  private user_activity: Prisma.user_activitiesDelegate<DefaultArgs>
  constructor() {
    this.user_activity = prismadb.user_activities
  }

  /**
   * save activity
   */
  public save(user_id: string, action: string, user_agent?: string) {
    return this.user_activity.create({
      data: {
        user_id,
        action,
        user_agent
      },
      select: {
        createdAt: true
      }
    })
  }

  /**
   * Patch activity
   */
  public patch(user_id: string, action: string, user_agent?: string, user_ip?: string, user_activity_id?: string) {
    const now = datekit().getTime()
    return this.user_activity.upsert({
      where: {
        user_activity_id: user_activity_id || 'abcd'
      },
      update: {
        frames: {
          increment: 1
        },
        updatedAt: new Date(now)
      },
      create: {
        user_id,
        action,
        user_agent,
        user_ip,
        createdAt: new Date(now),
        updatedAt: new Date(now)
      },
      select: {
        createdAt: true
      }
    })
  }

  /**
   * get last activity
   */
  public lastActivity(user_id: string, action: string) {
    const afterLastHour = datekit().minus(1, 'hour').getTime()

    return this.user_activity.findFirst({
      where: {
        user_id,
        action,
        createdAt: {
          // new Date() creates date with current time and day and etc.
          gte: new Date(afterLastHour)
        }
      },
      orderBy: {
        updatedAt: 'desc'
      },
      select: {
        user_activity_id: true,
        user_agent: true,
        frames: true
      }
    })
  }

  /**
   * get list of activities
   */
  public getList(user_id: string, take = 10) {
    return this.user_activity.findMany({
      where: { user_id },
      select: {
        user_activity_id: true,
        action: true,
        user_agent: true,
        createdAt: true
      },
      take,
      orderBy: {
        createdAt: 'desc'
      }
    })
  }

  /**
   * Get date of activity status
   */
  public getStatus() {
    return prismadb.$queryRaw`SELECT COUNT(1)::INT AS active_users, "updatedAt" AS date_at FROM user_activities_v GROUP BY "updatedAt" ORDER BY "updatedAt" DESC`
  }
}
export default new ActivityRepo()
