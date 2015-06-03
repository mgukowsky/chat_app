//Sanitize user input
function divEscapedContentElement(message) {
	return $('<div></div>').text(message);
};

//Display trusted content from system
function divSystemContentElement(message) {
	return $('<div></div>').html('<i>' + message + '</i>');
};

function processUserInput(chatApp, socket) {
	var message = $('#send-message').val();
	var systemMessage;
	//User has attempted to enter a command
	if (message.charAt(0) == '/') {
		systemMessage = chatApp.processCommand(message);
		if (systemMessage) {
			$('#messages').append(divSystemContentElement(systemMessage));
		}
	} else {
		//Otherwise, treat as a message to broadcast
		chatApp.sendMessage($('#room').text(), message, $('#name').text());
		$('#messages').append(divEscapedContentElement($('#name').text() + ': ' + message));
		$('#messages').scrollTop($('#messages').prop('scrollHeight'));
	}
	$('#send-message').val('');
};

//Ensure the socket doesn't catch events until the DOM is fully loaded
$(document).ready(function() {
	//Client side socket to handle events
	var socket = io.connect();
	
	var chatApp = new Chat(socket);
	
	socket.on('nameResult', function(result) {
		var message;
		if (result.success) {
			$('#name').text(result.name);
			message = 'You are now known as ' + result.name + '.';
		} else {
			message = result.message;
		}
		$('#messages').append(divSystemContentElement(message));
	});
	
	socket.on('setCookie', function(userId){
		document.cookie = 'userId=' + userId.val;
	});
	
	socket.on('joinResult', function(result) {
		$('#room').text(result.room);
		$('#messages').append(divSystemContentElement('Room changed.'));
	});
	
	socket.on('message', function (message) {
		var newElement = $('<div></div>').text(message.text);
		$('#messages').append(newElement);
	});
	
	socket.on('rooms', function(rooms) {
		$('#room-list').empty();
		for(var room in rooms) {
			room = room.substring(1, room.length);
			if (room != '') {
				$('#room-list').append(divEscapedContentElement(room));
			}
		}
		$('#room-list div').click(function() {
			chatApp.processCommand('/join ' + $(this).text());
			$('#send-message').focus();
		});
	});
	
	socket.on('readyForRecentMessages', function(){
		socket.emit('getRecentMessages', {bucket: $('#room').text()});
	});
	
	socket.on('sendRecentMessages', function(bucket){
		var chatBox = $('#messages');
		for (msg in bucket.messages) {
			chatBox.append(divEscapedContentElement(bucket.messages[msg]));
		};
	});
	
	setInterval(function() {
		socket.emit('rooms');
	}, 1000);
	
	$('#send-message').focus();
	
	$('#send-form').submit(function() {
		processUserInput(chatApp, socket);
		return false;
	});
});