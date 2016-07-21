/**
 * Created by luc on 21/07/16.
 */
var express = require("express");
var app = express();
var path = require("path");

app.use('/assets', express.static(__dirname + '/assets'));
app.use('/vendor', express.static(__dirname + '/vendor'));

app.get('/', function (req, res) {
  res.sendFile(path.join(__dirname + '/index.html'));
});

app.listen(80);

console.log("Running at Port 3000");