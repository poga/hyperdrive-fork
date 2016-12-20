const tape = require('tape')
const hyperdrive = require('hyperdrive')
const memdb = require('memdb')
const Readable = require('stream').Readable
const pump = require('pump')
const fork = require('.')
const collect = require('collect-stream')

tape('test', function (t) {
  var drive = hyperdrive(memdb())
  var source = drive.createArchive()
  var target = drive.createArchive()

  pump(write('hello world'), source.createFileWriteStream('foo.txt'), test)

  function test () {
    fork(source, target, err => {
      t.error(err)

      collect(target.createFileReadStream('foo.txt'), (err, data) => {
        t.error(err)
        t.same(data.toString(), 'hello world')
        t.end()
      })
    })
  }
})

function write (str) {
  var s = new Readable()
  s.push(str)
  s.push(null)
  return s
}
