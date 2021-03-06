var express= require('express');
var app = express();
var server = require('http').createServer(app);
var io  = require('socket.io').listen(server);
var mailer = require('nodemailer');
var transporter = mailer.createTransport('smtps://jamie337nichols%40gmail.com:E32414D9BD@smtp.gmail.com');
var mailOptions = {
	from:'"Big Bug ?" <jamie337nichols@gmail.com>',
	to:'jamie337nichols@gmail.com',
	subject:"Someone Joined",
	text:"Someone joined the game. come play http://allmyfiles.ddns.net:2046",
	html:"<h1>Someone Joined</h1><a href='http://allmyfiles.ddns.net:2046'>Come play</a>"
};
var bootTime = 300;
var requestRate = bootTime/2;
requestRate *= 1000;
bootTime*=1000;
var bugies = {};
connections = [];

server.listen(process.env.PORT || 2046);
app.use(express.static(__dirname + '/'));
app.get('/',function(req,res){
	res.sendFile(__dirname + '/index.html');
	
});

io.sockets.on('connection',function(socket){
	transporter.sendMail(mailOptions,function(error,info){
		if(error){
			return console.log(error);
		}
		console.log("Message Sent: " + info.response);
	});
	connections.push(socket);
	console.log("Connected: %s sockets connected",connections.length);
	
	//disconnect
	socket.on("disconnect",function(data){
		connections.splice(connections.indexOf(socket),1);
		bugid = socket.id.replace("/#","");
		delete bugies[bugid];
		io.sockets.emit("remove bug",bugid);
		console.log("Disconnected: %s sockets connected",Object.keys(bugies).length);	
		console.log("Buggies Object Has "+Object.keys(bugies).join(", ") + " in it");
		console.log(bugies);
	});
	
	socket.on('boot',function(bugid){
		bootBug("You've been idle too long","Refresh Page and stay active");
		io.sockets.connected["/X"+bugid].disconnect();
	});
	
	socket.emit('start',bugies);


	socket.on('add bugy',function(bug){
		console.log("buggy added");
		console.log(bug);
		if(bug){
			bugies[bug.id] = bug;
			console.log();
			io.sockets.emit('bugy added',bug);
		}
	});
	setInterval(function(){
		io.sockets.emit('request update');
	},requestRate);
	
	var to = setTimeout(function(){
				bootBug("You've been idle too long","Refresh Page and stay active");
	},bootTime);
	socket.on('update bug',function(bug){
		if(parseInt(bug.x) != parseInt(bugies[bug.id].x) || parseInt(bug.y) != parseInt(bugies[bug.id].y)){
			clearTimeout(to);
			to = setTimeout(function(){
				bootBug("You've been idle too long","Refresh Page and stay active");
			},bootTime);
		}
		bugies[bug.id] = bug;
		io.sockets.emit('update a bug',bug);
	});
		
	socket.on('remove bug',function(bug){
		delete bugies[bug.id];
	});
	
	socket.on('request update',function(){
		io.sockets.emit('request update');
	});

	function bootBug(r,f){
		socket.emit("force disconnect",{reason:r,fix:f});
		socket.disconnect();
	}
});