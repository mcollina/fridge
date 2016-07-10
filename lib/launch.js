'use strict'

const pump = require('pump')
const prefixer = require('color-prefix-stream')

function launch (service, done) {
  service.type.run(service, (err, stream) => {
    if (err) {
      return done(err)
    }

    var prefix = service.name
    if (service.id) {
      prefix += ` (${service.id})`
    }

    const filter = prefixer({
      prefix,
      rotate: true
    })

    service.output = filter

    pump(stream, filter)

    done(null, service)
  })
}

module.exports = launch
