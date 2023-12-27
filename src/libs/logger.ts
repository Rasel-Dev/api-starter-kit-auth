import { createLogger, format, transports } from 'winston'

const logLevels = {
  fatal: 0,
  error: 1,
  warn: 2,
  info: 3,
  debug: 4,
  trace: 5
}

const logger = createLogger({
  levels: logLevels,
  format: format.combine(format.timestamp(), format.json()),
  defaultMeta: {
    service: 'billing-service'
  },
  transports: [new transports.Console({}), new transports.File({ filename: 'logs/function.log' })]
  // process.env?.NODE_ENV === 'development'
  //   ? new transports.Console({})
  //   : new transports.File({ filename: 'logs/getway.log' })
})

export default logger

export const sysLog = createLogger({
  levels: logLevels,
  format: format.combine(format.timestamp(), format.json()),
  defaultMeta: {
    service: 'system-service'
  },
  // exceptionHandlers: [new transports.File({ filename: 'logs/exceptions.log' })],
  // rejectionHandlers: [new transports.File({ filename: 'logs/rejections.log' })],
  transports: [new transports.Console({}), new transports.File({ filename: 'logs/server.log', level: 'error' })]
  // process.env?.NODE_ENV === 'development'
  //   ? new transports.Console({})
  //   : new transports.File({ filename: 'logs/server.log', level: 'error' })
})
