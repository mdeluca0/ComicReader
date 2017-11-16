var myApp = angular.module('myApp', ['ngRoute', 'ngSanitize']);

myApp.config(function($routeProvider, $locationProvider) {
    $routeProvider
        .when('/', {
            templateUrl: 'views/home.html',
            controller: 'homeController'
        })
        .when('/volume/:id', {
            templateUrl: 'views/volume.html',
            controller: 'volumeController'
        })
        .when('/issue/:id', {
            templateUrl: 'views/issue.html',
            controller: 'issueController'
        })
        .when('/reader/:id/:page', {
            templateUrl: 'views/reader.html',
            controller: 'readerController'
        })
        .otherwise({
            redirectTo: 'views/404.html'
        });

    $locationProvider.html5Mode(true);
});


myApp.controller('homeController', function($scope, $http) {
    $http.get('/getLibrary').then(function (response) {
        $scope.library = response.data;
    });
});

myApp.controller('volumeController', function($scope, $routeParams, $http) {
    var volumeId = $routeParams.id;
    $http.get('/getVolume?id='+volumeId).then(function (response) {
        $scope.volume = response.data;
    });
});

myApp.controller('issueController', function($scope, $routeParams, $http, $sce) {
    var issueId = $routeParams.id;
    $http.get('/getIssue?id='+issueId).then(function (response) {
        $scope.issue = response.data;
        $scope.issue.description = $sce.trustAsHtml($scope.issue.description);
    });
});

myApp.controller('readerController', function($scope, $routeParams, $http) {
    var issueId = $routeParams.id;
    var pageNo = $routeParams.page;
    $http.get('/readIssue?id='+issueId+'&page='+pageNo).then(function (response) {
        $scope.base64Img = response.data.base64Img;
        $scope.id = response.data.id;
        $scope.currentPage = pageNo;

        var pageCount = response.data.pageCount;
        if (pageNo == 0) {
            $scope.previousPage = 0;
        } else {
            $scope.previousPage = parseInt(pageNo) - 1;
        }
        if (pageNo >= pageCount - 1) {
            $scope.nextPage = parseInt(pageNo);
        } else {
            $scope.nextPage = parseInt(pageNo) + 1;
        }

    });
});