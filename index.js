    var express = require('express'),
        http = require('http'),
		app = express(),
        config = require('./config.json');
    var server = http.createServer(app);
    var io = require('socket.io').listen(server);

    app.use(express.static(__dirname + '/src/client'));

    server.listen(config.port);
    console.log('\t :: Express :: Listening on port ' + config.port);


	var gs= require('./src/server/server');

	var gserver = new gs.GameServer();

	/* Connection events */

	io.on('connection', function(client) {
		console.log('User connected');

		client.on('joinGame', function(tank){
			console.log(tank.id + ' joined the gserver');
			var initX = gs.getRandomInt(40, 900);
			var initY = gs.getRandomInt(40, 500);
			client.emit('addTank', { id: tank.id, type: tank.type, isLocal: true, x: initX, y: initY, hp: config.tank_hp});
			client.broadcast.emit('addTank', { id: tank.id, type: tank.type, isLocal: false, x: initX, y: initY, hp: config.tank_hp} );

			gserver.addTank({ id: tank.id, type: tank.type, hp: config.tank_hp});
		});

		client.on('sync', function(data){
			//Receive data from clients
			if(data.tank != undefined){
				gserver.syncTank(data.tank);
			}
			///!change agent pos
            gserver.moveAgents();

			//update ball positions
			gserver.syncBalls();
			//Broadcast data to clients
			client.emit('sync', gserver.getData());
			client.broadcast.emit('sync', gserver.getData());

			//I do the cleanup after sending data, so the clients know
			//when the tank dies and when the balls explode
			gserver.cleanDeadTanks();
			gserver.cleanDeadBalls();
	//		counter ++;
		});

		client.on('shoot', function(ball){
			var ball = new gs.Ball(ball.ownerId, ball.alpha, ball.x, ball.y, gserver.lastBallId);
			gserver.increaseLastBallId();
			gserver.addBall(ball);
		});

		client.on('leaveGame', function(tankId){
			console.log(tankId + ' has left the gserver');
			gserver.removeTank(tankId);
			client.broadcast.emit('removeTank', tankId);
		});
	});
