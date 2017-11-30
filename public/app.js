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

    //$locationProvider.html5Mode(true); //TODO: fix this for page refreshes
});


myApp.controller('homeController', function($scope, $http) {
    $http.get('/getLibrary').then(function (response) {
        for (var i = 0; i < response.data.length; i++) {
            response.data[i].active_issues = response.data[i].issues.length;
        }
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

myApp.controller('readerController', function($scope, $routeParams, $document, $window, $http) {
    var issueId = $routeParams.id;
    var pageNo = $routeParams.page;
    $http.get('/readIssue?id='+issueId+'&page='+pageNo).then(function (response) {
        $scope.issue = response.data;
        $scope.base64Img = response.data.base64Img;
        $scope.currentPage = pageNo;
        $scope.pageNoDisplay = parseInt(pageNo) + 1;

        // Page bounds check
        var pageCount = response.data.page_count;
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

        // Keyboard Events for reader
        var handleKeyDown = function(event) {
            switch (event.keyCode) {
                case 37: // [Left]
                    $window.location.href = '#!/reader/'+issueId+'/'+$scope.previousPage;
                    break;
                case 39: // [Right]
                    $window.location.href = '#!/reader/'+issueId+'/'+$scope.nextPage;
                    break;
            }
            $scope.$apply();
        };
        $document.on('keydown', handleKeyDown);
        $scope.$on('$destroy', function() {
            $document.unbind('keydown', handleKeyDown);
        });

    });
});