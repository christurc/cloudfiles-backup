const CloudFilesApi = require('./cloudFilesApi')
const fs = require('fs')
const path = require('path')
const each = require('async/each')
const cmdArgs = require('command-line-args')

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

  var storageObjects = await api.getStorageObjects(options.container, 5)

  console.log(`* Total objects found: ${storageObjects.length}`)

  each(storageObjects, async function(o) {

    if(o.content_type === dirContentType) {
      handleDirectory(o.name)
      return
    }

    if(o.bytes > 0) {
      await handleFile()
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

async function handleFile(fileObject) {
  let targetPath = path.join(options.targetPath, fileObject.name)

  if(fs.existsSync(targetPath)){
    return
  }

  var fileBuffer = await api.download(options.container, fileObject)

  console.log(`* writing to: ${targetPath}`)
  fs.writeFileSync(targetPath, stream)
}

try {
  main()
} catch(e) {
  console.log(e)
  process.exit(1)
}
