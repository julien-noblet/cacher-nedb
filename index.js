var Datastore = require('nedb')

function now() { return (new Date()).getTime(); }

function CacherNeDB(options) {
  options = options || null
  var db;
  if (options.filename) 
    db = new Datastore({ filename: options.filename, autoload: true });
  else 
    db = new Datastore();
  db.ensureIndex({fieldName:"url",unique:true}); // ensure url as index
  if (options.compactionInterval!==null){
    db.persistence.setAutocompactionInterval(options.compactionInterval);
  }
  this.cache = db;
  if (options.cleanInterval!==null){
    setInterval(function(){
      db.remove({ ttl: { $lt : now() } }, {});
    }, options.cleanInterval); // Cleaning every 5 sec old cache
  }
}

CacherNeDB.prototype.set = function(key, cacheObject, ttl, cb) {
  cb = cb || function() {}
  if (typeof cacheObject == 'object') cacheObject = JSON.stringify(cacheObject)
  this.cache.update({ url: key }, {url :key, object : cacheObject, ttl: ttl*1000+now() }, { upsert: true }, cb);
}

CacherNeDB.prototype.get = function(key, cb) {
  console.log('get key :'+key);
  this.cache.findOne({ url: key }, function (err, doc) {
    if (err) return cb(err)
    try {
      doc = JSON.parse(doc)
    } catch (e) {
    } finally {
      if (doc===null)
        cb(null, doc)
      else{
        if (now() <= doc.ttl)
          cb (null,JSON.parse(doc.object))
        else{
          cb (null,null)
        }
          
      }
    }
    // If no document is found, doc is null
  });
}



CacherNeDB.prototype.invalidate = function(key, cb) {
  cb = cb || function() {}
  this.cache.remove({ url: key }, {}, cb);
}

module.exports = CacherNeDB
