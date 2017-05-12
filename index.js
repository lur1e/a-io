    var express = require('express'),
        app = express(),
        config = require('./config');

    var io = require('socket.io')(server);

//Static resources server
app.use(express.static(__dirname + '/www'));

var server = app.listen(process.env.PORT || config.PORT, function () {
	var port = server.address().port;
	console.log('Server running at port %s', port);
});


var game = new GameServer();

/* Connection events */

io.on('connection', function(client) {
	console.log('User connected');

	client.on('joinGame', function(tank){
		console.log(tank.id + ' joined the game');
		var initX = getRandomInt(40, 900);
		var initY = getRandomInt(40, 500);
		client.emit('addTank', { id: tank.id, type: tank.type, isLocal: true, x: initX, y: initY, hp: TANK_INIT_HP });
		client.broadcast.emit('addTank', { id: tank.id, type: tank.type, isLocal: false, x: initX, y: initY, hp: TANK_INIT_HP} );

		game.addTank({ id: tank.id, type: tank.type, hp: config.TANK_INIT_HP});
	});

	client.on('sync', function(data){
		//Receive data from clients
		if(data.tank != undefined){
			game.syncTank(data.tank);
		}
		//update ball positions
		game.syncBalls();
		//Broadcast data to clients
		client.emit('sync', game.getData());
		client.broadcast.emit('sync', game.getData());

		//I do the cleanup after sending data, so the clients know
		//when the tank dies and when the balls explode
		game.cleanDeadTanks();
		game.cleanDeadBalls();
		counter ++;
	});

	client.on('shoot', function(ball){
		var ball = new Ball(ball.ownerId, ball.alpha, ball.x, ball.y );
		game.addBall(ball);
	});

	client.on('leaveGame', function(tankId){
		console.log(tankId + ' has left the game');
		game.removeTank(tankId);
		client.broadcast.emit('removeTank', tankId);
	});

});

function Ball(ownerId, alpha, x, y){
	this.id = game.lastBallId;
	game.increaseLastBallId();
	this.ownerId = ownerId;
	this.alpha = alpha; //angle of shot in radians
	this.x = x;
	this.y = y;
	this.out = false;
}

Ball.prototype = {

	fly: function(){
		//move to trayectory
		var speedX = config.BALL_SPEED * Math.sin(this.alpha);
		var speedY = -config.BALL_SPEED * Math.cos(this.alpha);
		this.x += speedX;
		this.y += speedY;
	}

};

function getRandomInt(min, max) {
	return Math.floor(Math.random() * (max - min)) + min;
}
