function Employee(name, desc, type, price, count, img, hotkey) {
	this.name = name;
	this.count = count;
	this.type = type;
	this.price = price;
	this.img = img;
	this.desc = desc;
	this.hotkey = hotkey;
}

Employee.prototype.addCount = function(){
	this.count = this.count + 1;
	this.bucket.appearAt = new Date();
}
Employee.prototype.addDegree = function(){this.degree = this.degree + 1;};

Employee.prototype.increasePrice = function(){
	var increase = 100;
	if (this.type == 0) {increase *= 1.5;}
	else if (this.type == 1) {increase *= 1.2;}
	else if (this.type == 3) {increase *= 0.8;};
	this.price = this.price + increase;
}



function Bucket(employee, i) {
	this.employee = employee;
	this.employee.bucket = this;

	this.sprite  = game.scene.Sprite("img/service.png",game.layer);
    this.sprite.move(game.positions[employee.type], 50 + (127*i));
    this.sprite.size(game.imageWidth, game.imageWidth);
    this.sprite.update();
}

Bucket.prototype.disappear = function(update){
	this.sprite.setOpacity(0);
	this.visible = false;
	if(update){ this.sprite.update(); }
	if(this.employee.count > 0){
		var interval = 10/this.employee.count + 1;
		this.appearAt = new Date();
		this.appearAt.setTime((new Date()).getTime() + (interval*1000));	
	}
}

Bucket.prototype.appear = function(update) {
	this.sprite.setOpacity(1);
	this.visible = true;
	if(update){ this.sprite.update(); }
}

Bucket.prototype.shouldAppear = function() {
	return this.appearAt && this.appearAt.getTime() < (new Date()).getTime();
}


function Player(level, cash) {
	this.level = level;
	this.cash = cash;
}

Player.prototype.levelUp = function(){this.level = this.level + 1;}
Player.prototype.addCash = function(earn){this.cash = this.cash + earn;}
Player.prototype.canAfford = function(employee){return employee.price <= this.cash;}

//Customer stats
function Customer()
{
	var customer = {
		speeds: [1,1.4,1.7],
		moods: ["n","m","a"],

		setType: function() {
			//Generates customer type (e.g phone, e-mail)
			this.type = Math.floor(Math.random() * 4);
		},

		setMood: function() {
			var rand = Math.floor(Math.random() * 20);
			if (rand < 14) {
		        this.mood = 0;
		    } else if (rand < 17) {
		        this.mood = 1;
		    } else {
		        this.mood = 2;
		    }
		},

		setReward: function() {
			this.reward = 100 * game.player.level;
			if(this.mood === 1){ this.reward *= 5; }

			switch(this.type){
		        case 0: this.reward *= 1.5;
		        case 1: this.reward *= 1.2;
		        case 3: this.reward *= 0.8;
		    }
		},

		setReputation: function() {
			this.reputation = this.mood == 2 ? 3 : 1;
		},

		setSprite: function() {
			//Customer painting & level modfication
		    this.sprite  = game.scene.Sprite(this.image(this.type, this.mood), game.layer);
		    this.sprite.move(game.positions[this.type], -game.imageWidth);
		    this.sprite.size(game.imageWidth, game.imageWidth);
		    this.sprite.yv = 3 + 2*Math.log(game.player.level); // 3(L1) -> ~10(L10)
		    this.sprite.yv *= this.speeds[this.mood];
		    this.sprite.update();
		},

		getValues: function() {
			return {reward: this.reward, reputation: this.reputation}
		},

		image: function() {
    		return "img/"+game.types[this.type]+"-"+this.moods[this.mood]+".png";
		}
	}

	customer.setType();
	customer.setMood();
	customer.setReward();
	customer.setReputation();
	customer.setSprite();

	return customer;
}
