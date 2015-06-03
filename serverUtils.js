var fs = require('fs');

module.exports = {
	log: function(data){
		var d = new Date();
		console.log(d.toUTCString() + ': ' + data);
		//Uncomment below to write to a local log file
		//fs.appendFile('./serverLog.log', d.toUTCString() + ': ' + data + '\r\n'); //need \r in windows
	},
	
	logRequest: function(req){
		this.log('Received ' + req.method + ' request ' + req.__receivedAt__ + ' for ' + req.url);
	},
	
	logResponse: function(req, res){
		this.log('Responded ' + res.statusCode + ' for request ' + req.__receivedAt__ + ' for ' + req.url);
	}
};