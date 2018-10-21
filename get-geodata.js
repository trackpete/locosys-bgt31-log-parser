// This will download a local cache of geodata into the geodata subdirectory
// The parse.js script will also do this, but you can directly prepare the
// cache by running this only.

var geocoder = require("local-reverse-geocoder");

console.log("Preparing local geodata...");
geocoder.init({ dumpDirectory: "geodata" }, function() {
  console.log("hihi");
  var thisPoint = { latitude: -32.90616333333333, longitude: -68.818705 };
  geocoder.lookUp(thisPoint, function(err, res) {
    console.log(JSON.stringify(res, null, 2));
    if (err) throw err;
  });
});
