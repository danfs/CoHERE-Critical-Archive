angControllers.controller('AboutCtrl', ['$scope', '$http', '$sce','$routeParams', 'Data',

// function GridCtrl($scope,$http, $sce, $routeParams, Data) {

function($scope,$http, $sce, $routeParams, Data) {


	//this one has the data you are using all over your site
	Data.getDataAsync(function(results) {
	    console.log("results",results);	
	    $scope.projects = results;	

	});

 		
  }]);