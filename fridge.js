#! /usr/bin/env node

'use strict'

const fs = require('fs')
const path = require('path')
const pump = require('pump')
const minimist = require('minimist')
const commist = require('commist')
const helpme = require('help-me')
const run = require('./lib/run')

module.exports.run = run

function execRun (argv) {
  const args = minimist(argv)
  var yml = args._[0]

  if (!yml) {
    yml = path.join(process.cwd(), 'fridge.yml')
  }

  try {
    fs.accessSync(yml)
  } catch (err) {
    console.log(err.message)
    console.log()
    help(['run'])
    return
  }

  run(yml, (err, instance) => {
    if (err) {
      throw err
    }
    const services = instance.services
    Object.keys(services).forEach((name) => {
      pump(services[name].output, process.stdout, (err) => {
        if (err) {
          throw err
        }

        process.exit(0)
      })
    })
  })

  return true
}

function help (args) {
  const instance = helpme({
    dir: path.join(__dirname, 'help'),
    ext: '.txt'
  })

  instance.toStdout(args)

  return true
}

function start () {
  const program = commist()
    .register('run', execRun)
    .register('help', help)

  const result = program.parse(process.argv.splice(2))

  if (result) {
    execRun(result)
  }
}

if (require.main === module) {
  start()
}
