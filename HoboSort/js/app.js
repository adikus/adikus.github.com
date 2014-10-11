var hoboApp = angular.module('hoboApp', []);

hoboApp.controller('gameController', function($scope){
	$scope.customerNumbers = [0,0,0,0];

	$scope.employees = [
		new Employee(
			'Napoleon Bonerfarte',
			'Good at breaking bones. And phones.',
			0,
			1000*1.5,
			0,
			"img/employee1.png"
		),
		new Employee(
			'Durria Bananachin', 
			'The Facebook addict.',
			2,
			1000,
			0,
			"img/employee3.png"
		),
		new Employee(
			'Kazimir Waffles', 
			'Bird brain.',
			3,
			1000*0.8,
			0,
			"img/employee2.png"
		),
		new Employee(
			'Nigel Nybbles', 
			'Good old-fashioned postage.',
			1,
			1000*1.2,
			0,
			"img/employee4.png"
		)
	];

	$scope.player = new Player(0,10000);
	game.player = $scope.player;
	game.employees = $scope.employees;
	game.ngScope = $scope;
	$scope.satisfaction = 50;

	$scope.icons=[
		{
			src: "img/phone.png"
		},
		{
			src: "img/mail.png"
		},
		{
			src: "img/facebook.png"
		},
		{
			src: "img/twit.png"
		}
	];

	$scope.buyEmployee = function(employee) {
		if ($scope.player.canAfford(employee)) {
			$scope.player.addCash(-employee.price);
			employee.addCount();
			employee.increasePrice();
		}
	};

	$scope.getSatisfcationClass = function()
	{
		if($scope.satisfaction <= 25)
			return "is-red";
		if($scope.satisfaction <= 50)
			return "is-orange";
		if($scope.satisfaction <= 75)
			return "is-light-orange";

		return "is-green";
	}
	$scope.startGame=function(){
		$("#dialogue-box").fadeOut();
		game.running=true;
		game.ticker.run();
		initWave();
	}

	$scope.displayWaveTimer = function() {
		return game.nextWaveAt && (new Date()).getTime() < game.nextWaveAt.getTime() && game.running;
	}

	$scope.waveTimer = 0; 
});