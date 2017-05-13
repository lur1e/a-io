    var express = require('express'),
        http = require('http'),
		app = express(),
        config = require('./config.json');
    var server = http.createServer(app);
    var io = require('socket.io').listen(server);

    app.use(express.static(__dirname + '/src/client'));

    server.listen(config.port);
    console.log('\t :: Express :: Listening on port ' + config.port);


	var gserver= require('./src/server/server');

	var game = new gserver.GameServer();

	/* Connection events */

	io.on('connection', function(client) {
		console.log('User connected');

		client.on('joinGame', function(tank){
			console.log(tank.id + ' joined the game');
			var initX = gserver.getRandomInt(40, 900);
			var initY = gserver.getRandomInt(40, 500);
			client.emit('addTank', { id: tank.id, type: tank.type, isLocal: true, x: initX, y: initY, hp: config.tank_hp});
			client.broadcast.emit('addTank', { id: tank.id, type: tank.type, isLocal: false, x: initX, y: initY, hp: config.tank_hp} );

			game.addTank({ id: tank.id, type: tank.type, hp: config.tank_hp});
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
	//		counter ++;
		});

		client.on('shoot', function(ball){
			var ball = new gserver.Ball(ball.ownerId, ball.alpha, ball.x, ball.y, game.lastBallId);
			game.increaseLastBallId();
			game.addBall(ball);
		});

		client.on('leaveGame', function(tankId){
			console.log(tankId + ' has left the game');
			game.removeTank(tankId);
			client.broadcast.emit('removeTank', tankId);
		});
	});
