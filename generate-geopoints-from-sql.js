// This will be a program to pull the data out of sqlite and generate
// reports and images/etc.

// Imports / modules / libraries / etc.
var StaticMaps = require("staticmaps");
var sqlite3 = require("sqlite3").verbose();
var db = new sqlite3.Database("cache/localdb.sqlite");

// DB table structure reminder
// "CREATE TABLE IF NOT EXISTS gpsData (dateTime TEXT PRIMARY KEY, countryCode TEXT, placeName TEXT, timeZone TEXT, localeName TEXT, latDegrees NUMERIC, longDegrees NUMERIC, groundSpeedMPH NUMERIC)"

const options = {
  width: 4000,
  height: 4000
};
const map = new StaticMaps(options);

const marker = {
  img: `marker-small.png`, // can also be a URL
  offsetX: 1,
  offsetY: 1,
  width: 10,
  height: 10,
};  

// Pull in data from SQL for testing
var sql = `SELECT * FROM gpsData WHERE strftime('%Y', dateTime) = '2010' ORDER BY dateTime ASC`;
//var sql = `SELECT * FROM gpsData ORDER BY dateTime ASC`;


db.all(sql, [], (err, rows) => {
  if (err) {
    throw err;
  }
  rows.forEach(row => {
    marker.coord = [ row.longDegrees, row.latDegrees ];
    map.addMarker(marker);
    //console.log(row.latDegrees, row.longDegrees);
  });

  //console.log(JSON.stringify(map, null, 2));
  map.render()
  .then(() => map.image.save('cache/testing-multi-marker-2010.png'))
  .then(() => { console.log('File saved!'); })
  .catch(console.log);
});


  
