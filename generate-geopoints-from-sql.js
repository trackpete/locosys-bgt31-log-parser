// This will be a program to pull the data out of sqlite and generate
// reports and images/etc.

// Imports / modules / libraries / etc.
var sqlite3 = require("sqlite3").verbose();
var db = new sqlite3.Database("cache/localdb.sqlite");