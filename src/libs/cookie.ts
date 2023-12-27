import { Response } from 'express'

export const setAuthCookie = (jwtToken: string, res: Response): void => {
  const tokenAge = 7 * 24 * 60 * 60 * 1000 // 7 days
  res.cookie('_token', jwtToken, {
    httpOnly: true,
    sameSite: 'none',
    secure: process.env.NODE_ENV !== 'production',
    maxAge: tokenAge
  })
  res.cookie('logged_in', true, { httpOnly: false, maxAge: tokenAge })
  // res.cookie('jwt', jwtToken, { httpOnly: true, sameSite: 'none', maxAge: 24 * 60 * 60 * 1000 });
}

export const clearAuthCookie = (res: Response): void => {
  res.clearCookie('_token')
  res.clearCookie('logged_in')
}
