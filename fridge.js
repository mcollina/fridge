'use strict'

const fs = require('fs')
const YAML = require('yamljs')
const path = require('path')
const types = require('./lib/types')
const pump = require('pump')
const prefixer = require('color-prefix-stream')
const steed = require('steed')

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
        service.path = path.join(path.dirname(yml), service.name)
      }

      if (!types[service.type]) {
        cb(new Error('unknown type ' + service.type))
        return
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
        service.output.destroy()
      }, cb || noop)
    }
  })
}

function launch (service, done) {
  types[service.type].run(service, (err, stream) => {
    if (err) {
      return done(err)
    }

    service.output = stream

    pump(service.output, prefixer({
      prefix: `${service.name} (${service.pid})`,
      rotate: true
    }))

    done(null, service)
  })
}

function noop () {}

module.exports.run = run
