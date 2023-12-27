import { Prisma } from '@prisma/client'
import { DefaultArgs } from '@prisma/client/runtime/library'
import prismadb from 'src/libs/prismadb'

class ResetPwdRepo {
  private reset: Prisma.reset_passwordsDelegate<DefaultArgs>
  constructor() {
    this.reset = prismadb.reset_passwords
  }

  /**
   * This method save resets old hashedPassword
   * @param user_id Who reset the password
   * @param last_pwd_hashed last hashedPassword for strong security
   */
  public save(user_id: string, last_pwd_hashed: string) {
    return this.reset.create({
      data: {
        user_id,
        last_pwd_hashed
      },
      select: {
        reset_password_id: true
      }
    })
  }

  /**
   * Verify the reset id
   * @param reset_password_id string
   */
  public verify(reset_password_id: string) {
    return this.reset.findFirstOrThrow({
      where: {
        reset_password_id,
        active: true
      },
      select: {
        last_pwd_hashed: true
      }
    })
  }

  /**
   * Expire the performed reset id
   * @param reset_password_id string
   */
  public expire(reset_password_id: string) {
    return this.reset.update({
      where: { reset_password_id },
      data: {
        active: false
      }
    })
  }
}
export default new ResetPwdRepo()
