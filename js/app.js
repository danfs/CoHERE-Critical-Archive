'use strict';

var angControl  = angular.module('angControl', [
  'ngRoute',
  'angControllers',
  'ui.bootstrap']);



angControl.config(['$routeProvider',
  function($routeProvider, $controllerProvider) {
    $routeProvider.
      when('/grid', {
        templateUrl: 'partials/grid.html',
        controller: 'GridCtrl'
      }).
      when('/about', {
        templateUrl: 'partials/about.html',
        controller: 'AboutCtrl'
      }).
      when('/grid/:ID', {
        templateUrl: 'partials/grid-detail.html',
        controller: 'GridDetailCtrl'
      }).
      otherwise({
        redirectTo: '/grid'
      });

  }]);