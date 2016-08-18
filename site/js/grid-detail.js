angControllers.controller('GridDetailCtrl', ['$scope', '$http', '$sce','$routeParams','$uibModal', '$log' , 'Data',

function($scope,$http, $sce, $routeParams,$uibModal, $log, Data) {

  	$scope.id = $routeParams.ID;

 	///gets the  main json from the factory
  	Data.getDataAsync(function(results) {
	    console.log("results",results);	
	    $scope.projects = results.posts;

	    //go through the main json and check for an id match with the route param id
	    for (var i = 0; i < $scope.projects.length; i++) {
	    	
	    		if($scope.id == $scope.projects[i].id){
	    			
	    			$scope.project = $scope.projects[i];

	    		}
	    };	
	});

}]);
