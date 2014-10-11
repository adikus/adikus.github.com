
/*types = ["email","facebook","twitter","phone"];
names = ["Andrea","Nick","Andy","Kaj"];
prices = [5,5,5,5]; */

function Employee(name, desc, type, price, count, img) {
	this.name = name;
	this.count = count;
	this.type = type;
	this.price = price;
	this.img = img;
	this.desc = desc;
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



function Bucket(employee) {
	this.employee = employee;
	this.employee.bucket = this;
}

Bucket.prototype.disappear = function(){
	this.sprite.setOpacity(0);
	this.visible = false;
	if(this.employee.count > 0){
		var interval = 10/this.employee.count + 1;
		this.appearAt = new Date();
		this.appearAt.setTime((new Date()).getTime() + (interval*1000));	
	}
}

Bucket.prototype.appear = function() {
	this.sprite.setOpacity(1);
	this.visible = true;
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
