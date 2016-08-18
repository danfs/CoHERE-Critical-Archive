

var angControllers  = angular.module('angControllers', ['angular-packery']);


angControllers.filter("trustUrl", ['$sce', function ($sce) {
        return function (recordingUrl) {
            return $sce.trustAsResourceUrl(recordingUrl);
        };
    }]);

angControllers.factory('Data', function($http){
	var URL = "data/digitalcultures_projects.json";
	return {
    getDataAsync: function(callback) {
    	//console.log("returned");
      $http.get(URL).success(callback);
    }
  };
});

