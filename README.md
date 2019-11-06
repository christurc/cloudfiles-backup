# CloudFiles Backup

Backs up files stored on Rackspace Cloud Files to local storage. This is useful when you have your own solution for backing up your local storage and you want that extra layer of protection to backup what you have on Rackspace. I know, kind of absurd that you think that you can provide a better backup solution than what Rackspace already has but Rackspace doesn't protect you against accidental deletion of files on Cloud Files. If that happens, your files are gone.

This provides an extra level of redundancy.

The first time you run this tool it will download all the files you have on the given Cloud Files container. This WILL take some time. Any subsequent time you run this will NOT download all the files on the container given that the files already exist locally. It will simply perform an MD5 hash comparison to verify the integrity of the file. If the hash check fails, it will re-download the file to replace the corrupted one.

> Uses the [Rackspace Storage](https://developer.rackspace.com/docs/cloud-files/v1/storage-api-reference/) API to achieve this.

## Usage

I have made no attempts to publish this on NPM so you're going to just have to clone the whole thing

* Install [Node v12 LTS](https://nodejs.org/en/about/releases/)
* `git clone` this repo
* Run `node index.js [options]`

### Options

* `-apiKey`: Rackspace API Key, alias `-k`, required
* `-userName`: Rackspace user name, alias `-u`, required
* `-container`: Rackspace CloudFiles container to backup, alias `-c`, required
* `-targetPath`: The local path to where you want to store the files, alias `-p`, required
* `-maxObjects`: The max number of objects to sync, alias `-m`, required
* `-logPath`: The location the logs will be written. Path must exist otherwise logs will not be written, alias `-l`, required

#### Example

```sh
node index.js -k abcde -u poohbear \
     -p /Users/foo/null -c audio -m 21 -l /Users/foo/logs
```