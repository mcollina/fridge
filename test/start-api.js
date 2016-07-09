'use strict'

const t = require('tap')
const fridge = require('..')
const split = require('split2')
const path = require('path')

t.plan(6)

fridge.run(path.join(__dirname, 'start', 'fridge.yml'), (err, instance) => {
  t.tearDown(() => {
    instance.close()
  })

  t.error(err)
  t.equal(Object.keys(instance.services).length, 2, 'number of services')

  t.ok(instance.services.a, 'service a exists')
  t.ok(instance.services.b, 'service b exists')

  waitForLine(instance.services.a, 'hello from a')
  waitForLine(instance.services.b, 'hello from b')

  function waitForLine (s, expected) {
    s.output
      .pipe(split())
      .on('data', (line) => {
        t.equal(line, expected, 'line matches')
      })
  }
})

