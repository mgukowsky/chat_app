var http = require('http');
var fs = require('fs');
var path = require('path');
//Determine MIME type by file extension
var mime = require('mime');
//Serving a file from RAM is considerably faster than repeatedly
//accessing fs.
var cache = {};

function send404(response){
	response.writeHead(404, {'Content-Type': 'text/plain'});
	response.write('Error 404: resource not found.');
	response.end();
};

function sendFile(res, filePath, fileContents){
	res.writeHead(
		200, 
		{"content-type": mime.lookup(path.basename(filePath))}
	);
	res.end(fileContents);
};

//Serve cached resource, otherwise load it or send a 404
function serveStatic(res, cache, absPath){
	if (cache[absPath]){
		sendFile(res, absPath, cache[absPath]);
	} else {
		fs.exists(absPath, function(exists){
			if (exists) {
				fs.readFile(absPath, function(err, data){
					if (err) {
						send404(res);
					} else {
						cache[absPath] = data;
						sendFile(res, absPath, data);
					}
				});
			} else {
				send404(res);
			}
		});
	}
};

var server = http.createServer(function(req, res){
	var filePath = false;
	
	if (req.url == '/') {
		filePath = 'public/index.html';
	} else {
		filePath = 'public' + req.url;
	}
	var absPath = './' + filePath
	serveStatic(res, cache, absPath);
});

server.listen(3000, function(){
	console.log("Server listening on port 3000.");
});

var chatServer = require('./lib/chat_server');
chatServer.listen(server) //Share same TCP/IP port