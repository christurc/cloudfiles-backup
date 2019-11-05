const CloudFilesApi = require('./cloudFilesApi')
const fs = require('fs')
const path = require('path')
const each = require('async/each')
const cmdArgs = require('command-line-args')
const crypto = require('crypto')
const maxObjects = 20

const dirContentType = 'application/directory'

const optionDefinitions = [
  { name: 'apiKey', alias: 'k', type: String },
  { name: 'userName', alias: 'u', type: String },
  { name: 'container', alias: 'c', type: String },
  { name: 'targetPath', alias: 'p', type: String }
]

const options = cmdArgs(optionDefinitions)

if(!options.apiKey) {
  console.error(`* ERROR: --apiKey not provided`)
  process.exit(1)
}

if(!options.userName) {
  console.error(`* ERROR: --userName not provided`)
  process.exit(1)
}

if(!options.targetPath) {
  console.error(`* ERROR: --targetPath not provided`)
  process.exit(1)
}

if(!options.container) {
  console.error(`* ERROR: --container not provided`)
  process.exit(1)
}

if(!fs.existsSync(options.targetPath)) {
  console.error(`* ERROR: Given target path does not exist: ${options.targetPath}`)
  process.exit(1)
}

// authorizes and gets the API key and endpoint uri for cloudfiles
async function main() {

  const api = new CloudFilesApi(options.apiKey, options.userName)
  await api.authenticate()

  var storageObjects = await api.getStorageObjects(options.container, maxObjects)

  console.log(`* Total objects found: ${storageObjects.length}`)

  // change this to perform synchronously
  each(storageObjects, async function(o) {

    if(o.content_type === dirContentType) {
      handleDirectory(o.name)
      return
    }

    if(o.bytes > 0) {
      await handleFile(api, o)
    }

  }, function(err) {
    if(err) {
      console.log(err)
    }
  })
}

function handleDirectory(pathInContainer) {
  let targetPath = path.join(options.targetPath, pathInContainer)

  if(!fs.existsSync(targetPath)){
    console.log(`* creating dir: ${targetPath}`)
    fs.mkdirSync(targetPath, { recursive: true })
  }
}

async function handleFile(api, fileObject) {
  let targetPath = path.join(options.targetPath, fileObject.name)
  let actualHash = ''

  if(fs.existsSync(targetPath)){
    actualHash = await calculateHash(targetPath)

    if(fileObject.hash === actualHash) {
      console.log(`* File found ${targetPath} and is valid`)
      return
    }
    else {
      console.log(`* File found ${targetPath} but is NOT valid, attempting to redownload`)
      console.log(`  Expected ${fileObject.hash}`)
      console.log(`  Actual ${actualHash}`)
    }
  }

  actualHash = ''

  let fileBuffer = await api.download(options.container, fileObject)
  let hasher = crypto.createHash('md5')

  hasher.update(fileBuffer)

  actualHash = hasher.digest('hex')

  if(fileObject.hash === actualHash) {
    console.log(`* writing to: ${targetPath}`)
    fs.writeFileSync(targetPath, fileBuffer)
  }
  else {
    console.error(`* ERROR: Downloaded ${targetPath} was corrupt`)
    console.log(`  Expected ${fileObject.hash}`)
    console.log(`  Actual ${actualHash}`)
  }
}

async function calculateHash(filePath) {
  let hasher = crypto.createHash('md5')
  let stream = fs.createReadStream(filePath)

  return new Promise((resolve, reject) => {
    hasher.setEncoding('hex')
    
    stream.on("error", error => reject(error));

    stream.on('end', function() {
      hasher.end()
      resolve(hasher.read())
    })

    stream.pipe(hasher) 
  })

}

try {
  main()
} catch(e) {
  console.log(e)
  process.exit(1)
}
