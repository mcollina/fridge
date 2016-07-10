'use strict'

const childProcess = require('child_process')
const through = require('through2')
const pump = require('pump')
const p = require('path')

function run (service, cb) {
  const cwd = p.dirname(service.path)
  const output = through()
  const env = {}
  var args = [service.path]

  if (service.args) {
    args = args.concat(service.args)
  }

  service.env = service.env || {}

  Object.keys(process.env).forEach((key) => {
    env[key] = process.env[key]
  })

  Object.keys(service.env).forEach((key) => {
    env[key] = service.env[key]
  })

  const child = childProcess.spawn(process.execPath, args, {
    cwd,
    env,
    stdio: ['ignore', 'pipe', 'pipe'],
    detached: false
  })

  pump(child.stdout, output)
  pump(child.stderr, output)

  service.child = child
  service.id = child.pid
  service.destroy = function (cb) {
    child.kill()
    cb()
  }

  cb(null, output)
}

module.exports.run = run
