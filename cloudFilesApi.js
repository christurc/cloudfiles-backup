const request = require("request-promise-native")
const _ = require('lodash')
const path = require('path')
const urlJoin = require('url-join')
const fs = require('fs')
const pino = require('./logger')
const logger = pino.instance()

const authenticateUrl = new URL('https://identity.api.rackspacecloud.com/v2.0/tokens')

module.exports = class {

  constructor(apiKey, username) {
    this.apiKey = apiKey
    this.username = username
    this.authToken = null
    this.publicUrl = null
  }

  async authenticate() {
    const options = {
      method: 'POST',
      url: authenticateUrl,
      headers: { 
        Accept: 'application/json',
        'Content-Type': 'application/json'
      },
      body: {
        auth: {
          'RAX-KSKEY:apiKeyCredentials': {
            username: this.username,
            apiKey: this.apiKey
          }
        }
      },
      json: true
    }

    let authResponse;

    try {
      authResponse = await request(options)
    }
    catch(e) {
      logger.error(e.message)
      process.exit(1)
    }

    this.authToken = authResponse.access.token.id

    if(this.authToken == null) {
      logger.error('* authToken was not found')
      process.exit(1)
    }

    logger.info(`* authToken: ${this.authToken}`)

    const catalog = _.find(authResponse.access.serviceCatalog, function(c) {
      return c.name === 'cloudFiles'
    })

    if(catalog == null) {
      logger.error('* catalog for "cloudFiles" was not found')
      process.exit(1)
    }

    const endpoint = _.find(catalog.endpoints, function(e) {
      return e.region === 'IAD'
    })

    if(endpoint == null) {
      logger.error('* endpoint for "IAD" (Virginia) was not found')
      process.exit(1)
    }

    logger.info(`* cloudfiles URI: ${endpoint.publicURL}`)

    this.publicUrl = new URL(endpoint.publicURL)
  }

  async getStorageObjects(container, limit) {
    limit = limit || 5

    var options = {
      method: 'GET',
      url: new URL(urlJoin(this.publicUrl.href, container)),
      headers: { 
        Accept: 'application/json',
        'X-Auth-Token': this.authToken
      },
      qs: {
        limit: limit
      },
      json: true
    }

    logger.info(`* GET ${options.url} ${this.authToken}`)

    try {
      return await request(options)
    }
    catch(e) {
      logger.error(`* ERROR: while running getStorageObjects. Perhaps container "${container}" does not exist.`)
      logger.error(e.message)
      process.exit(1)
    }
  }

  async download(container, fileObject) {
    const url = new URL(urlJoin(this.publicUrl.href, container, fileObject.name))

    var options = {
      method: 'GET',
      url: url,
      encoding: null, // forces response as Buffer
      headers: { 
        Accept: fileObject.content_type,
        'X-Auth-Token': this.authToken
      }
    }

    logger.info(`* download: ${url} | size: ${fileObject.bytes}`)

    try {
      return await request(options)

    }
    catch(e) {
      logger.error('* ERROR: while running getStorageObjects')
      logger.error(e.message)
      process.exit(1)
    }
  }
}