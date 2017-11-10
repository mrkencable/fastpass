
module.exports = function(res) {
var express = require('express');
var app = express();

app.get('/', function(req, res){
	res.send('GET request to the homepage');
	console.log("Express Get");
});
console.log("DONE ROUTER.JS");
}
console.log("DONE ROUTER.JS LAST LINE ");
