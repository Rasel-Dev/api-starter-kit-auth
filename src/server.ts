import compression from 'compression'
import cookieParser from 'cookie-parser'
import cors from 'cors'
import express, { NextFunction, Request, Response } from 'express'
import useragent from 'express-useragent'
import helmet from 'helmet'
import hpp from 'hpp'
import { Server as HttpServer, createServer } from 'http'
import { HttpTerminator, createHttpTerminator } from 'http-terminator'
import path from 'path'
import favicon from 'serve-favicon'
import authController from './controllers/auth.controller'
import userController from './controllers/user.controller'
import { authorityCors } from './libs/cors'
import { sysLog } from './libs/logger'
import { systemRateLimit } from './libs/rate-limiter'

class ExpressServer {
  express: express.Application
  server: HttpServer
  httpTerminator: HttpTerminator

  constructor() {
    // const options = {
    //   key: readFileSync(join('./cert/key.pem')),
    //   cert: readFileSync(join('./cert/cert.pem'))
    // }
    this.express = express()
    this.server = createServer(this.express)
    this.httpTerminator = createHttpTerminator({ server: this.server })
    this._configure()
    this._routes()
    this._errorRoutes()
  }

  private _configure(): void {
    // Features
    this.express.set('trust proxy', 1)
    this.express.set('port', process.env.PORT || 8000)
    // Core Middlewares
    // this.express.use(cors(corsOptions))
    this.express.use(helmet())
    this.express.use(cookieParser())
    this.express.use(useragent.express())
    // parse application/x-www-form-urlencoded
    this.express.use(express.urlencoded({ extended: true, limit: '100kb' }))
    // parse application/json
    this.express.use(express.json({ limit: '10kb', type: 'application/json' }))
    this.express.use(hpp())
    this.express.use(compression())
    this.express.use(express.static(path.resolve('public')))
    this.express.use(favicon(path.resolve('public', 'favicon.ico')))
    this.express.use(systemRateLimit)
  }

  private _routes(): void {
    this.express.get('/', (_req: Request, res: Response) => {
      res.send('All Ok.')
    })
    /**
     * Internal services
     */
    this.express.use(cors(authorityCors))
    this.express.use('/v1/auth/', authController.router)
    this.express.use('/v1/users/', userController.router)
    // routeLogs(this.express)
  }

  private _errorRoutes(): void {
    // ERROR POINTS
    this.express.use((_req: Request, res: Response): void => {
      res.status(404).send('Not found!')
    })
    // response api errors
    this.express.use((err: Error, req: Request, res: Response, next: NextFunction) => {
      // console.log('res.headersSent :', res.headersSent)
      if (res.headersSent) {
        return next(err)
      }
      res.status(500).send('Server not responding.')

      if (process.env.NODE_ENV !== 'production') {
        console.log('Error encountered:', err.stack || err)
      } else {
      }
      sysLog.error(err + '', { meta: req.url })
      // console.log('req.url :', req.url)
      if (err?.message === 'cors') return res.end('Not allowed by CORS')
      //   return next(err)
    })

    this.express.use((err: Error, req: Request, _res: Response) => {
      // Your error handler ...
      // sysLog.warn(err.message || err)
      sysLog.error(err + '', { meta: req.url })
      // console.log('Error XYZ:', _err.message || _err)
    })
  }

  public start(): void {
    this.server.listen(this.express.get('port'), () => {
      if (process.env.NODE_ENV !== 'production') {
        // console.clear()
        sysLog.info(`Server listening on http://localhost:${this.express.get('port')}`)
      }
    })
  }
}

export default new ExpressServer()
