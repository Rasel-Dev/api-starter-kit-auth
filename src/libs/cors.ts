import cors from 'cors'
import { APP_ENV } from '..'
export const allowedOrigins = ['http://localhost:3000', 'http://localhost:5173']

const clientCors: cors.CorsOptions = {
  origin: function (origin: any, callback) {
    // Allow request with no origins (like mobile apps or curl requests)
    // console.log('origin :', origin)
    if (allowedOrigins.indexOf(origin) !== -1 || !origin) {
      callback(null, true)
    } else {
      callback(null, false)
    }
  },
  allowedHeaders: [
    'Origin',
    'X-Requested-With',
    'Content-Type',
    'Accept',
    'X-Access-Token',
    'Authorization',
    'x-api-key'
  ],
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  credentials: true,
  optionsSuccessStatus: 200
}

export default clientCors

export const authorityCors: cors.CorsOptions = {
  origin: function (origin: any, callback) {
    // Allow request with no origins (like mobile apps or curl requests)
    if (!origin || origin === APP_ENV.AUTH_APP_URI) {
      callback(null, true)
    } else {
      callback(new Error('cors'))
    }
  },
  allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'X-Access-Token', 'Authorization'],
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  credentials: true,
  optionsSuccessStatus: 200
}
