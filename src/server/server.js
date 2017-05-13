var config = require('../../config.json');

function GameServer(){
    this.tanks = [];
    this.balls = [];
    this.lastBallId = 0;

    this.addAgent();
}

GameServer.prototype = {

    addAgent: function(){
        var initX = getRandomInt(40, 900);
        var initY = getRandomInt(40, 500);
        this.tanks.push({ id: "Agent_1", type: 1, hp: config.tank_hp, agent: true, x: initX, y: initY, isLocal: false,
            baseAngle: 45})
    },

    addTank: function(tank){
        this.tanks.push(tank);
    },

    addBall: function(ball){
        this.balls.push(ball);
    },

    removeTank: function(tankId){
        //Remove tank object
        this.tanks = this.tanks.filter( function(t){return t.id != tankId} );
    },

    //Sync tank with new data received from a client
    syncTank: function(newTankData){
        this.tanks.forEach( function(tank){
            if(tank.id == newTankData.id){
                tank.x = newTankData.x;
                tank.y = newTankData.y;
                tank.baseAngle = newTankData.baseAngle;
                tank.cannonAngle = newTankData.cannonAngle;
            }
        });
    },

    moveAgents: function () {
        this.tanks.forEach( function(tank){
            if(tank.agent == true){
                moveAgent(tank);
            }
        });
    },


    //The app has absolute control of the balls and their movement
    syncBalls: function(){
        var self = this;
        //Detect when ball is out of bounds
        this.balls.forEach( function(ball){
            self.detectCollision(ball);

            if(ball.x < 0 || ball.x > config.width
                || ball.y < 0 || ball.y > config.height){
                ball.out = true;
            }else{
                ball.fly();
            }
        });
    },

    //Detect if ball collides with any tank
    detectCollision: function(ball){
        var self = this;

        this.tanks.forEach( function(tank){
            if(tank.id != ball.ownerId
                && Math.abs(tank.x - ball.x) < 30
                && Math.abs(tank.y - ball.y) < 30){
                //Hit tank
                self.hurtTank(tank);
                ball.out = true;
                ball.exploding = true;
            }
        });
    },

    hurtTank: function(tank){
        tank.hp -= 2;
    },

    getData: function(){
        var gameData = {};
        gameData.tanks = this.tanks;
        gameData.balls = this.balls;

        return gameData;
    },

    cleanDeadTanks: function(){
        this.tanks = this.tanks.filter(function(t){
            return t.hp > 0;
        });
    },

    cleanDeadBalls: function(){
        this.balls = this.balls.filter(function(ball){
            return !ball.out;
        });
    },

    increaseLastBallId: function(){
        this.lastBallId ++;
        if(this.lastBallId > 1000){
            this.lastBallId = 0;
        }
    }

};


function Ball(ownerId, alpha, x, y, ballId){
    this.id = ballId;
    this.ownerId = ownerId;
    this.alpha = alpha; //angle of shot in radians
    this.x = x;
    this.y = y;
    this.out = false;
}

Ball.prototype = {

    fly: function(){
        //move to trayectory
        var speedX = config.ball_speed * Math.sin(this.alpha);
        var speedY = -config.ball_speed * Math.cos(this.alpha);
        this.x += speedX;
        this.y += speedY;
    }

};

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min)) + min;
}

function randomBinomal(){
    return Math.random() - Math.random();
}

function moveAgent(tank) {
    x = 0
    if(x === 0){
        //console.log(tank.baseAngle);
        var moveX = 5 * Math.sin(tank.baseAngle);
        var moveY = 5 * Math.cos(tank.baseAngle);
        if(tank.x + moveX > (0 + 30) && (tank.x + moveX) < (config.width - 30)){
            tank.x += moveX;
        }
        else{
            tank.baseAngle += 90;
            tank.baseAngle = tank.baseAngle % 360;
        }
        if(tank.y + moveY > (0 + 30) && (tank.y + moveY) < (config.height - 30)){
            tank.y += moveY;
        }
        else{
            tank.baseAngle += 90;
            tank.baseAngle = tank.baseAngle % 360;
        }
        //tank.x = tank.x + getRandomInt(-5,5);
        //tank.y = tank.y + getRandomInt(-5,5);
    }
}

function newmoveAgent(tank){
    var angle = tank.baseAngle;
    angle += randomBinomal() * 4;
    var tangle = angle + tank.baseAngle;

}

module.exports = {
    GameServer : GameServer,
    Ball: Ball,
    getRandomInt: function (min, max) {
        return Math.floor(Math.random() * (max - min)) + min;
    }
};