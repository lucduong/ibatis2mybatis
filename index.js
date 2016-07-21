/**
 * Created by luc on 21/07/16.
 */
var express = require("express");
var app = express();
var path = require("path");
var port = process.env.PORT || 3000;

app.use('/assets', express.static(__dirname + '/assets'));
app.use('/vendor', express.static(__dirname + '/vendor'));

app.get('/', function (req, res) {
  res.sendFile(path.join(__dirname + '/index.html'));
});

app.listen(port);

console.log("Running at Port " + port);