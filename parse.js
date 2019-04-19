// This is a rudimentary program being built as a proof of concept first,
// after which it will be refined.

// Imports / modules / libraries / etc.
var recurse = require("recursive-readdir");
var async = require("async");
var fs = require("fs");
var lineByLineReader = require("line-by-line");
var geocoder = require("local-reverse-geocoder");
var distance = require("fast-haversine");
// Minimum distance in meters between points to dedupe
var minPointDistance = 25;

console.log("Initializing local geodata, this may take a bit...");
var startGeodata = process.hrtime();
geocoder.init(
  { dumpDirectory: "geodata", load: { alternateNames: false } },
  function() {
    endGeodata = process.hrtime(startGeodata);
    console.log(
      "Local geodata loaded in %ds %dms",
      endGeodata[0],
      endGeodata[1] / 1000000
    );
    loadDataFiles();
  }
);

//loadDataFiles();

function loadDataFiles(callback) {
  // gps data file directory
  var dataDir = "data";
  // Maximum parallel files to scan
  var maxParallel = 5;

  // Find all files in the dataDir then call scanFile to read them
  // limited to maxParallel file reads at a time

  recurse(dataDir).then(
    function(processFiles) {
      console.log("Found", processFiles.length, "files to process!");
      async.eachLimit(processFiles, maxParallel, scanFile, function(err) {
        if (err) throw err;
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

function printName(fileName, loopNext) {
  console.log(fileName);
  loopNext();
}

function scanFile(gpsFile, loopNext) {
  // Make sure we only try to mess with text files
  if ((fileName = gpsFile.match(/(\/|\\).*\.(TXT|txt)/))) {
    // Convert the date extracted from the filename to epoch base time for informational output
    console.log("Scanning data file:", gpsFile);

    // Instead of using a third party parser, we're going to do some of our own magic
    // Read in the file, find the specific lines we want, split the CSV, and add
    // them to an array
    var gpsData = [];
    var lastPoint = { lat: 0, lon: 0 };
    var droppedPoints = 0;

    // Tracking localeNames for summary output - using a set to only store unique values
    var localeNames = new Set();

    // Using line by line to read the file synchronously because we need
    // to compare each line to the previous line(s) to determine how close
    // they are to each other
    lineReadFile = new lineByLineReader(gpsFile)
      .on("error", function(err) {
        if (err) throw err;
      })
      .on("line", function(line) {
        // Only process NMEA sentences for GPS location data
        // This is a CSV formatted line and we're just going to split it into an array
        // and extract the relevant portions that we care about directly.
        if (line.startsWith("$GPRMC")) {
          var lineArray = line.split(",");
          // only use valid fixes
          if (lineArray[2] == "A") {
            var latData = lineArray[3].match(/^(\d\d)(\d\d\.\d+)$/);
            var latDegrees =
              parseFloat(latData[1]) + parseFloat(latData[2] / 60);
            if (lineArray[4] === "S") {
              latDegrees = latDegrees * -1;
            }
            var longData = lineArray[5].match(/^(\d\d\d)(\d\d\.\d+)$/);
            var longDegrees =
              parseFloat(longData[1]) + parseFloat(longData[2] / 60);
            if (lineArray[6] === "W") {
              longDegrees = longDegrees * -1;
            }
            // console.log("Datapoint:", latDegrees, ",", longDegrees);
            // We're going to calculate the haversine distance between this point
            // and the last point that was more than minPointDistance away
            var thisPoint = { lat: latDegrees, lon: longDegrees };
            //console.log(gpsFile, "Distance:", distance(lastPoint, thisPoint), lastPoint, thisPoint);
            if (distance(lastPoint, thisPoint) > minPointDistance) {
              // lookup some information on this point to save for later
              geocoder.lookUp(
                { latitude: latDegrees, longitude: longDegrees },
                function(err, res) {
                  if (err) throw err;
                  //console.log(JSON.stringify({ latitude: latDegrees, longitude: longDegrees }, null, 2), JSON.stringify(res, null, 2));

                  // Calculate time and date
                  var timeArray = lineArray[1].match(
                    /^(\d\d)(\d\d)(\d\d)\.(\d\d\d)/
                  );
                  var dateArray = lineArray[9].match(/^(\d\d)(\d\d)(\d\d)/);
                  var thisPointDate = new Date(
                    "20" +
                      dateArray[3] +
                      "-" +
                      dateArray[2] +
                      "-" +
                      dateArray[1] +
                      "T" +
                      timeArray[1] +
                      ":" +
                      timeArray[2] +
                      ":" +
                      timeArray[3] +
                      "." +
                      timeArray[4] +
                      "Z"
                  );
                  //console.log(thisPointDate);
                  // Convert knots to MPH - 1 knot = 1.15078 mph
                  var groundSpeed = lineArray[8] * 1.15078;

                  gpsData.push({
                    date: thisPointDate,
                    latDegrees: latDegrees,
                    longDegrees: longDegrees,
                    groundSpeedMPH: groundSpeed,
                    countryCode: res[0][0].countryCode,
                    placeName: res[0][0].asciiName,
                    timeZone: res[0][0].timezone,
                    localeName: res[0][0].admin1Code.asciiName
                  });
                  localeNames.add(
                    res[0][0].admin1Code.asciiName + " " + res[0][0].countryCode
                  );
                }
              );

              // Oh yeah, classic lazy implementation of comparison loops
              lastPoint = { lat: latDegrees, lon: longDegrees };
            } else {
              //console.log(gpsFile, lastPoint, "is less than", minPointDistance, "meters from", thisPoint, " - ignoring");
              droppedPoints++;
            }
          }
        }
      })
      .on("end", function() {
        // At some point we'll actually do something here
        // console.log(JSON.stringify(gpsData, null, 2));
        if (gpsData.length < 1) {
          // Some files don't have records because they didn't stay on long enough, this can be used for debugging those.
          //console.log("WARNING: GPS Array for", gpsFile, "has ZERO records!");
        } else if (localeNames.size > 0) {
          // Throws some final information about the files processed
          console.log("GPS Array for", gpsFile, "has", gpsData.length, "records (" + droppedPoints + " dropped) in the following locales:", localeNames);
        } else {
          // Throws some information about files that don't have any locale data, which means something went wrong in reverse lookup
          console.log(
            "WARNING: GPS Array for",
            gpsFile,
            "has",
            gpsData.length,
            "records (" + droppedPoints + " dropped) but no locales!"
          );
          //console.log(JSON.stringify(gpsData, null, 2));
        }
        loopNext();
      });
  } else {
    console.log(
      "Ignoring file",
      gpsFile,
      "as it's not a text file"
    );
  }
}
