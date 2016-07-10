#! /usr/bin/env node

'use strict'

const fs = require('fs')
const YAML = require('yamljs')
const path = require('path')
const pump = require('pump')
const steed = require('steed')
const minimist = require('minimist')
const types = require('./lib/types')
const launch = require('./lib/launch')

function run (yml, cb) {
  fs.readFile(yml, 'utf8', (err, data) => {
    if (err) {
      return cb(err)
    }

    var services

    try {
      services = YAML.parse(data)
    } catch (err) {
      return cb(err)
    }

    const names = Object.keys(services)
    const servicesArray = new Array(services.length)

    for (var i = 0; i < names.length; i++) {
      const service = services[names[i]]
      service.name = names[i]

      if (!service.path) {
        service.path = path.resolve(path.join(path.dirname(yml), service.name))
      }

      if (!types[service.type]) {
        cb(new Error('unknown type ' + service.type))
        return
      } else {
        service.type = types[service.type]
      }

      servicesArray[i] = service
    }

    steed.each(servicesArray, launch, (err) => {
      cb(err, {
        services,
        close
      })
    })

    function close (cb) {
      steed.each(servicesArray, (service, cb) => {
        service.destroy(cb)
      }, cb || noop)
    }
  })
}

function noop () {}

module.exports.run = run

function start () {
  const args = minimist(process.argv.slice(2))
  var yml = args._[0]

  if (!yml) {
    yml = path.join(process.cwd(), 'fridge.yml')
  }

  try {
    fs.accessSync(yml)
  } catch (err) {
    console.log(err.message)
    console.log('Usage: fridge [YML]')
    process.exit(1)
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
}

if (require.main === module) {
  start()
}
