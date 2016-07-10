'use strict'

const childProcess = require('child_process')
const through = require('through2')
const pump = require('pump')
const p = require('path')

function run (service, cb) {
  const output = through()

  // TODO support args
  const child = childProcess.spawn(process.execPath, [service.path], {
    cwd: p.dirname(service.path),
    // TODO support custom env
    env: process.env,
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
