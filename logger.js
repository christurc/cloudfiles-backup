const pino = require('pino')
const fs = require('fs')
const path = require('path')

let logger = null

module.exports = {
  configure: function(logPath) {
    if(!logPath || !fs.existsSync(logPath)) {
      console.log(`* INFO: logPath ${logPath} does not exist on file system`)
      console.log(`* INFO: logging to console`)
      logger = pino()
      return logger
    }

    const now = new Date()

    const logFilePath = path.join(logPath, `log_${now.toDateString()}_${now.valueOf()}.txt`)

    logger = logger || pino(pino.destination(logFilePath))

    return logger
  },

  instance: function() { return logger }
}