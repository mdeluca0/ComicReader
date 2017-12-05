angular.module('home', ['ngRoute']);

angular.module('home').controller('homeCtrl', function($scope, $http) {
    $http.get('/getLibrary').then(function (response) {
        for (var i = 0; i < response.data.length; i++) {
            response.data[i].active_issues = response.data[i].issues.length;
        }
        $scope.library = response.data;
    });
});