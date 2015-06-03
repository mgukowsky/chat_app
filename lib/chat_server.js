var socketio = require('socket.io');
var io;
var guestNumber = 1;
var nickNames = {};
var namesUsed = [];
var currentRoom = {};
var nameRegister = {};
var sRandom = require('secure-random');
var messageRegister = {};

var getCookie = function(socket){
	return socket.manager.handshaken[socket.id].headers.cookie;
};

var getCookieVal = function(socket){
	return socket.manager.handshaken[socket.id].headers.cookie.split('=')[1];
};

var ensureAndCacheMessage = function(room, msg){
	if (!messageRegister[room]){
		messageRegister[room] = [];
	}
	var bucket = messageRegister[room];
	if (bucket.length > 100) {
		bucket.shift();
	}
	bucket.push(msg);
}

exports.listen = function(server) {
	//Socket.IO is designed to piggyback on an existing HTTP server port
	io = socketio.listen(server);
	io.set('log level', 1);
	
	//Fired when a new user connects
	io.sockets.on('connection', function (socket, paramtwo) {
		if (getCookie(socket)){
			var userId = getCookieVal(socket);
			guestNumber = assignGuestName(socket, guestNumber, nickNames, namesUsed, userId);
		} else {
			guestNumber = assignGuestName(socket, guestNumber,
				nickNames, namesUsed);
		}
		joinRoom(socket, 'Lobby');
		
		//Listeners for various user events
		handleMessageBroadcasting(socket, nickNames);
		handleNameChangeAttempts(socket, nickNames, namesUsed);
		handleRoomJoining(socket);
		
		//Fired when user requests info on rooms
		socket.on('rooms', function() {
			socket.emit('rooms', io.sockets.manager.rooms);
		});
		
		socket.on('getRecentMessages', function(room){
			socket.emit('sendRecentMessages', {messages: messageRegister[room.bucket]});
		});
		
		handleClientDisconnection(socket, nickNames, namesUsed);
	});
};

function assignGuestName(socket, guestNumber, nickNames, namesUsed, userId) {
	var name;
	if (userId) {
		name = nameRegister[userId];
	} else {
		name = 'Guest' + guestNumber;
		namesUsed.push(name);
		socket.emit('setCookie', {val: socket.id});
		nameRegister[socket.id] = name;
	}
	nickNames[socket.id] = name;
	socket.emit('nameResult', {
		success: true,
		name: name
	});
	return guestNumber + 1;
};

function joinRoom(socket, room) {
	//Add the connection
	socket.join(room);
	//Current room for the new connection
	currentRoom[socket.id] = room;
	socket.emit('joinResult', {room: room});
	//Send a message to everyone (all other sockets) in the room.
	socket.broadcast.to(room).emit('message', {
		text: nickNames[socket.id] + ' has joined ' + room + '.'
	});
	var usersInRoom = io.sockets.clients(room);
	if (usersInRoom.length > 1) {
		var usersInRoomSummary = 'Users currently in ' + room + ': ';
		for (var index in usersInRoom) {
			var userSocketId = usersInRoom[index].id;
			if (userSocketId != socket.id) {
				if (index > 0) {
					usersInRoomSummary += ', ';
				}
				usersInRoomSummary += nickNames[userSocketId];
			}
		}
		usersInRoomSummary += '.';
		socket.emit('message', {text: usersInRoomSummary});
	}
	socket.emit('readyForRecentMessages');
};

//Name must be unique and cannot begin with 'Guest'
function handleNameChangeAttempts(socket, nickNames, namesUsed) {
	socket.on('nameAttempt', function(name) {
		if (name.indexOf('Guest') == 0) {
			socket.emit('nameResult', {
				success: false,
				message: 'Names cannot begin with "Guest".'
			});
		} else {
			if (namesUsed.indexOf(name) == -1) {
				var previousName = nickNames[socket.id];
				var previousNameIndex = namesUsed.indexOf(previousName);
				namesUsed.push(name);
				nickNames[socket.id] = name;
				//Clean up old name
				delete namesUsed[previousNameIndex];
				var tmpId = getCookie(socket);
				if (tmpId) {
					nameRegister[getCookieVal(socket)] = name;
				} else {
					//Fallback in case cookie does not exist
					socket.emit('setCookie', {val: socket.id});
					nameRegister[socket.id] = name;
				}
				socket.emit('nameResult', {
					success: true,
					name: name
				});
				socket.broadcast.to(currentRoom[socket.id]).emit('message', {
					text: previousName + ' is now known as ' + name + '.'
				});
			} else {
				socket.emit('nameResult', {
					success: false,
					message: 'That name is already in use.'
				});
			}
		}
	});
};

//Handles the 'message' event when emitted by client
function handleMessageBroadcasting(socket) {
	socket.on('message', function (message) {
		ensureAndCacheMessage(message.room, message.username + ': ' + message.text);
		socket.broadcast.to(message.room).emit('message', {
			text: nickNames[socket.id] + ': ' + message.text
		});
	});
};

function handleRoomJoining(socket) {
	socket.on('join', function(room) {
		socket.leave(currentRoom[socket.id]);
		joinRoom(socket, room.newRoom);
	});
};

function handleClientDisconnection(socket) {
	socket.on('disconnect', function() {
		var nameIndex = namesUsed.indexOf(nickNames[socket.id]);
		//Uncomment if not using cookies
		//delete namesUsed[nameIndex];
		delete nickNames[socket.id];
	});
};