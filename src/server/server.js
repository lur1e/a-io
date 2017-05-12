function GameServer(){
    this.tanks = [];
    this.balls = [];
    this.lastBallId = 0;
}

GameServer.prototype = {

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

    //The app has absolute control of the balls and their movement
    syncBalls: function(){
        var self = this;
        //Detect when ball is out of bounds
        this.balls.forEach( function(ball){
            self.detectCollision(ball);

            if(ball.x < 0 || ball.x > config.WIDTH
                || ball.y < 0 || ball.y > config.HEIGHT){
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

}