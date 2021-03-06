# Chat App ([live](http://chat.mgukowsky.com))

## Summary

Based on a Socket.IO app from the book [*Node.js in Action*](http://www.manning.com/cantelon/) by Cantelon et al.
Adds several additional features. Designed as a project to use the low-level features of Node.

## About

* Socket.IO functionality is used for faster responsiveness on page updates than AJAX requests.
* After being served once, assets are cached server-side to allow for fast delivery.
* Uses cookies to memorize user names, including default names, keeping a client-side registry of all user IDs.
* Caches and serves 100 most recent posts for each room. Server remembers posts even when the room is empty.
* Writes all requests and responses to a log file, using a unique identifier for each request. Ensures
scalability by assigning each request/response pair a unique identifier even if more than one occurs
per millisecond.
* Guarantees content is always delivered, even in the event of a 500 error.

## [Live App](http://chat.mgukowsky.com)

### Usage

On your first visit, you will be assigned a user name consisting of 'Guest' and a number.
You can change your user name (nickname) by entering the following command:

	/nick TypeNewNameHere

You are placed in the lobby by default, but you can change your room with:

	/join TypeNewRoomNameHere
If the room does not yet exist, it will be created.

## Build Locally

Download the zip file, extract the contents, and check that you have Node.js and npm installed.

To install dependencies and start the server, run the following two commands in the directory where you extracted the files:

	npm install
	node server.js

You may then access the app by pointing your browser to localhost:5000 (an alias of 127.0.0.1:5000).
On a single machine, you may open up another browser at the same address to see the communication in action!
Enjoy :)
