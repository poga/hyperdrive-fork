const pump = require('pump')

module.exports = function (source, target, cb) {
  source.list((err, entries) => {
    if (err) return cb(err)

    // since list returns a history of all modified file.
    // we need to dedup manually here
    var entriesDeDuped = {}
    entries.forEach(entry => { entriesDeDuped[entry.name] = entry })
    entries = Object.keys(entriesDeDuped).map(name => entriesDeDuped[name])

    next()

    function next (err) {
      if (err) return cb(err)
      var entry = entries.shift()
      if (!entry) {
        // done!
        return cb(null)
      }

      // directories
      if (entry.type === 'directory') {
        return target.append({
          name: entry.name,
          type: 'directory',
          mtime: entry.mtime
        }, next)
      }

      // skip other non-files, undownloaded files, and the old manifest
      if (
        entry.type !== 'file' ||
        !source.isEntryDownloaded(entry)
      ) {
        return next()
      }

      // copy the file
      pump(
        source.createFileReadStream(entry),
        target.createFileWriteStream({ name: entry.name, mtime: entry.mtime, ctime: entry.ctime }),
        next
      )
    }
  })
}
