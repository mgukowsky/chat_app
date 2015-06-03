var http = require('http');
var fs = require('fs');
var path = require('path');
//Determine MIME type by file extension
var mime = require('mime');
var utils = require('./serverUtils');
//Serving a file from RAM is considerably faster than repeatedly
//accessing fs.
var cache = {};
//Use to further ID requests if more than 1 is received per millisecond
var requestCounter = 0;

function send404(req, res){
	if (cache['./public/404.html']){
		sendFile(req, res, './public/404.html', cache['./public/404.html'], true);
	} else {
		fs.exists('./public/404.html', function(exists){
			if (exists) {
				fs.readFile('./public/404.html', function(err, data){
					if (err) {
						send500Fallback(req, res, 'Error reading 404 template');
					} else {
						cache['./public/404.html'] = data;
						utils.log('Cached ' + './public/404.html');
						sendFile(req, res, './public/404.html', data, true);
					}
				});
			} else {
				send500Fallback(req, res, '404 template not found');
			}
		});
	}
};

function send500Fallback(req, res, msg){
	res.writeHead(500, {'Content-Type': 'text/plain'});
	res.write('500: Internal Server Error (' + msg + ')');
	utils.logResponse(req, res);
	res.end();
};

function sendFile(req, res, filePath, fileContents, is404){
	var statusCode;
	if (is404) {
		statusCode = 400;
	} else {
		statusCode = 200;
	}
	res.writeHead(
		statusCode, 
		{"content-type": mime.lookup(path.basename(filePath))}
	);
	utils.logResponse(req, res);
	res.end(fileContents);
};

//Serve cached resource, otherwise load it or send a 404
function serveStatic(req, res, cache, absPath){
	if (cache[absPath]){
		sendFile(req, res, absPath, cache[absPath]);
	} else {
		fs.exists(absPath, function(exists){
			if (exists) {
				fs.readFile(absPath, function(err, data){
					if (err) {
						send404(req, res);
					} else {
						utils.log('Cached ' + absPath);
						cache[absPath] = data;
						sendFile(req, res, absPath, data);
					}
				});
			} else {
				send404(req, res);
			}
		});
	}
};

function requestCounterInc(){
	var orig = requestCounter;
	requestCounter += 1;
	return orig;
};

var server = http.createServer(function(req, res){
	var timer = new Date();
	req.__receivedAt__ = timer.getTime() + '-' + requestCounterInc();
	
	utils.logRequest(req);
	
	var filePath = false;
	
	if (req.url == '/') {
		filePath = 'public/index.html';
	} else {
		filePath = 'public' + req.url;
	}
	var absPath = './' + filePath
	serveStatic(req, res, cache, absPath);
});

//For Heroku compatibility (Heroku apps run on port 5000)
server.listen(process.env.PORT || 5000, function(){
	utils.log("Server started on port 5000.");
});

var chatServer = require('./lib/chat_server');
chatServer.listen(server) //Share same TCP/IP port