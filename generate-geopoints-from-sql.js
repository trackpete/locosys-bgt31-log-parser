// This will be a program to pull the data out of sqlite and generate
// reports and images/etc.

// Imports / modules / libraries / etc.
var StaticMaps = require("staticmaps");
var sqlite3 = require("sqlite3").verbose();
var db = new sqlite3.Database("cache/localdb.sqlite");

// DB table structure reminder
// "CREATE TABLE IF NOT EXISTS gpsData (dateTime TEXT PRIMARY KEY, countryCode TEXT, placeName TEXT, timeZone TEXT, localeName TEXT, latDegrees NUMERIC, longDegrees NUMERIC, groundSpeedMPH NUMERIC)"

const options = {
  width: 3000,
  height: 2000
};
const map = new StaticMaps(options);

// const marker = {
//   img: `marker.png`, // can also be a URL
//   offsetX: 0,
//   offsetY: 0,
//   width: 10,
//   height: 10,
// };  

// To begin with, we'll just pull in all the data!
// var sql = `SELECT * from gpsData limit 5`;

// db.all(sql, [], (err, rows) => {
//   if (err) {
//     throw err;
//   }
//   rows.forEach(row => {
//     marker.coord = [ row.latDegrees, row.longDegrees ];
//     map.addMarker(marker);
//     console.log(row.latDegrees, row.longDegrees);
//   });

//   const zoom = 3;
//   const center = [32.77743 -115.57048166666667];
//   const bbox = [42.649573,-143.159263,23.263801,-74.841999]
//   console.log(JSON.stringify(map, null, 2));
//   map.render(bbox)
//   .then(() => map.image.save('multiple-marker.png'))
//   .then(() => { console.log('File saved!'); })
//   .catch(console.log);
// });

// fuuuck
const marker = {
  img: `${__dirname}/marker-small.png`, // can also be a URL,
  offsetX: 0,
  offsetY: 0,
  width: 10,
  height: 10,
  coord: [13.437524, 52.4945528],
 };
map.addMarker(marker);
map.render()
  .then(() => map.image.save('single-marker.png'))
  .then(() => { console.log('File saved!'); })
  .catch(console.log);