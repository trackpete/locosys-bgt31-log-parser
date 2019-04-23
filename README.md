*Note: This is a work in progress!*

This will turn into a log parser for the NMEA sentences in my gps logs from various adventures.

I didn't use a full project stack because the intent is for this to be simple standalone code to render data into a format used in another project - it will just dump data into an sqlite database.

NMEA sentences are pretty easy to handle directly, but I wanted to enrich them with other geoip data hence I'm just using my own parser instead of grabbing a third party module.

* Should remove low confidence nodes
* Remove nodes close to each other to clean up track
* Enrich with geo data


# Running / In Progress Notes

1. npm install
2. npm run get-geodata
3. npm run parse

The parsing start is very much in development.

* Note that the local geodata can take up a lot of space!


# Older Notes

https://www.gpsinformation.org/dale/nmea.htm

* GPGGA: GPS fix data
* GPGSA: Overall satellite reception data
* GPRMC: Minimum recommended data -> need this for date!

Notes for modules to use:

* Bluebird for promises - http://bluebirdjs.com/docs/getting-started.html
* Reverse geocoding offline - https://www.npmjs.com/package/local-reverse-geocoder
* Fast haversine distance between points - https://www.npmjs.com/package/fast-haversine

## De-dup notes

Removing points close to each other is an interesting proposition because we have to calculate the haversine distance between each of the points. I think a good way to do this (summarized) would be:

1. Load all the data into an object keyed by time
2. Iterate through the object time by time. On each timestamp, calculate the haversine distance between the current line and the proceeding lines until the distance is exceeded. Then remove all of the elements within that distance from the object within a certain time window.
3. Then move onto the next line that's still in the object, repeat.

Why not just do a filter on points? If I visit position X and then go to Y/Z/etc. then come back to X, I don't want to remove all re-occurences of X. Iterating by timestamps will ensure I only remove duplicates of each "unique" visit to X.

# SQLite notes

* Get distinct dates: `SELECT DISTINCT DATE(dateTime) FROM gpsdata;`
* all states/countries: `select distinct localeName, countryCode from gpsData order by countryCode;`