angular.module('myApp', [
    'home',
    'volume',
    'issue',
    'reader'
]);

angular.module('myApp').config(function($routeProvider, $locationProvider) {
    $routeProvider
        .when('/', {
            templateUrl: 'modules/home/home.html',
            controller: 'homeCtrl'
        })
        .when('/volume/:id', {
            templateUrl: 'modules/volume/volume.html',
            controller: 'volumeCtrl'
        })
        .when('/issue/:id', {
            templateUrl: 'modules/issue/issue.html',
            controller: 'issueCtrl'
        })
        .when('/reader/:id', {
            templateUrl: 'modules/reader/reader.html',
            controller: 'readerCtrl'
        })
        .otherwise({
            redirectTo: 'modules/home/home.html'
        });

    //$locationProvider.html5Mode(true); //TODO: fix this for page refreshes
});