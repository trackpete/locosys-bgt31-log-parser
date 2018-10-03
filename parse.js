// This is a rudimentary program being built as a proof of concept first,
// after which it will be refined.

// Imports / modules / libraries / etc.
var recurse = require("recursive-readdir");
var async = require("async");
var fs = require("fs");
var lineByLineReader = require('line-by-line');


// Configuration parameters - should extract to a config file
var dataDir = 'data';
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

// Function to scan the GPS file
function scanFile(gpsFile, callback) {
  console.log("Scanning data file:", gpsFile);

  // Only parse actual GPSUSER text files that we can extract the date from
  if (fileName = gpsFile.match(/(\/|\\)GPSUSER_\d+_(\d+)_\d+\.TXT/)) {
    var fileDate = fileName[2];
    // Instead of using a third party parser, we're going to do some of our own magic
    // Read in the file, find the specific lines we want, split the CSV, and add
    // them to an array
    const gpsData = {};
  
    // NOTE: Looks like the timestamp in the NMEA sentence is 24 hour only.
    // I'll need to add parsing of date from filename
    // hopefully I didn't change any filenames in my records...
  
    lineReadFile = new lineByLineReader(gpsFile)
    .on('error', function (err) {
      if(err) throw err;
    })
    .on('line', function (line) {
      if (line.startsWith('$GPGGA')) {
        var lineArray = line.split(',');
        // don't add invalid fixes
        if (lineArray[6] > 0) {
          gpsData[lineArray[1]] = ({
            lat: lineArray[2],
            latDir: lineArray[3],
            long: lineArray[4],
            longDir: lineArray[5],
            quality: lineArray[6],
            numSats: lineArray[7],
            dilution: lineArray[8],
            altitude: lineArray[9],
            altitudeMeasure: lineArray[10]
          }); 
        }
      }
    })
    .on('end', function() {
      console.log("Done reading", gpsFile);
      console.log(JSON.stringify(gpsData, null, 2));
    });
  } else {
    console.log("Ignoring file", gpsFile, "as it does not appear to be a standard named locosys file");
  }
}
