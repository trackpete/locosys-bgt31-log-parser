// This is a rudimentary program being built as a proof of concept first,
// after which it will be refined.

// Imports / modules / libraries / etc.
var recurse = require("recursive-readdir");
var async = require("async");
var fs = require("fs");
var lineByLineReader = require('line-by-line');
var geocoder = require('local-reverse-geocoder');
var distance = require('fast-haversine');
// Minimum distance in meters between points to dedupe
var minPointDistance = 25;

console.log("Checking local geodata...");
/* geocoder.init({dumpDirectory: 'geodata', load:{alternateNames:false}}, function() {
  console.log("Local geodata loaded!");
  loadDataFiles();
}); */
loadDataFiles();

function loadDataFiles(callback) {
  // gps data file directory
  var dataDir = 'data';
  // Maximum parallel files to scan
  var maxParallel = 5;

  // Find all files in the dataDir then call scanFile to read them
  // limited to maxParallel file reads at a time
  recurse(dataDir).then(
    function(processFiles) {
      async.eachLimit(processFiles, maxParallel, scanFile, function(err, bar) {
        if(err) throw err;
      });
    },
    function(error) {
      console.error("Error reading data files!", error);
      process.exit(1);
    }
  );
}
// Checks to see if we have a valid GPS file and tries to parse it
// This will include:
//   * determining date time
//   * extracting appropriate GPS data
//   * enriching GPS data
//   * removing nearby datapoints
//   * outputting data
function scanFile(gpsFile, callback) {
  // Only parse actual GPSUSER text files that we can extract the date from
  if (fileName = gpsFile.match(/(\/|\\)GPSUSER_\d+_(\d+)_\d+\.TXT/)) {
    var fileDate = fileName[2];
    // Convert the date extracted from the filename to epoch base time - we will add
    // the UTC timestamps from the NMEA records to this later to create epoch milli
    // timestamps for tracking
    console.log("Scanning data file:", gpsFile, "with date of", fileDate);
    
    // Instead of using a third party parser, we're going to do some of our own magic
    // Read in the file, find the specific lines we want, split the CSV, and add
    // them to an array
    var gpsData = [];
    var lastPoint = {lat: 0, lon: 0};
    var droppedPoints = 0;

  
    // Using line by line to read the file synchronously because we need
    // to compare each line to the previous line(s) to determine how close
    // they are to each other
    lineReadFile = new lineByLineReader(gpsFile)
    .on('error', function (err) {
      if(err) throw err;
    })
    .on('line', function (line) {
      // Only process NMEA sentences for GPS location data
      // This is a CSV formatted line and we're just going to split it into an array
      // and extract the relevant portions that we care about directly.
      if (line.startsWith('$GPGGA')) {
        var lineArray = line.split(',');        
        // don't add invalid fixes
        if (lineArray[6] > 0) {
          // Calculate decimal degrees from latlong
          // We're using nested ifs here to keep this synch and clean
          var latData = lineArray[2].match(/^(\d\d)(\d\d\.\d+)$/);
          var latDegrees = (parseFloat(latData[1]) + parseFloat((latData[2] / 60)));
          if (lineArray[3] === "S") {
            latDegrees = latDegrees * -1;
          }
          var longData = lineArray[4].match(/^(\d\d\d)(\d\d\.\d+)$/);
          var longDegrees = (parseFloat(longData[1]) + parseFloat(longData[2] / 60));
          if (lineArray[5] === "W") {
            longDegrees = longDegrees * -1;
          }
          //console.log("Datapoint:", latDegrees, ",", longDegrees);
          // We're going to calculate the haversine distance between this point
          // and the last point that was more than minPointDistance away
          var thisPoint = {lat: latDegrees, lon: longDegrees};
          //console.log(gpsFile, "Distance:", distance(lastPoint, thisPoint), lastPoint, thisPoint);
          if (distance(lastPoint, thisPoint) > minPointDistance) {
            var thisPoint = {latitude: latDegrees, longitude: longDegrees};
            //geocoder.lookUp(thisPoint, function(err, res) {
              //if (err) throw err;
              //console.log(res[0][0].name);
              //console.log(JSON.stringify(res, null, 2));
              gpsData.push(
              {
                fileDate: fileDate,
                rawTime: lineArray[1],
                latDegrees: latDegrees,
                longDegrees: longDegrees,
                quality: lineArray[6],
                numSats: lineArray[7],
                dilution: lineArray[8],
                altitude: lineArray[9],
                altitudeMeasure: lineArray[10],
                //countryCode: res[0][0].countryCode,
                //placeName: res[0][0].asciiName,
                //timeZone: res[0][0].timezone,
                //localeName: res[0][0].admin1Code.asciiName
              });  
            //}); 
            // Oh yeah, classic lazy implementation of comparison loops
            lastPoint = {lat: latDegrees, lon: longDegrees};
          } else {
            //console.log(gpsFile, lastPoint, "is less than", minPointDistance, "meters from", thisPoint, " - ignoring");
            droppedPoints++;
          }
        }
      }
    })
    .on('end', function() {
      // At some point we'll actually do something here
      //console.log(JSON.stringify(gpsData, null, 2));
      console.log("GPS Array for", gpsFile, "has", gpsData.length, "records");
      console.log("(dropped", droppedPoints, "points)");
    });
  } else {
    console.log("Ignoring file", gpsFile, "as it does not appear to be a standard named locosys file");
  }
}
