'use strict'

const fs = require('fs')
const YAML = require('yamljs')
const path = require('path')
const steed = require('steed')
const types = require('./types')
const launch = require('./launch')

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

function runWithFolder (yml, cb) {
  fs.stat(yml, function (err, stat) {
    if (err) {
      return cb(err)
    }

    if (stat.isDirectory()) {
      yml = path.join(yml, 'fridge.yml')
    }

    run(yml, cb)
  })
}

module.exports = runWithFolder
