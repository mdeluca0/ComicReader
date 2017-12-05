angular.module('volume', ['ngRoute']);

angular.module('volume').controller('volumeCtrl', function($scope, $routeParams, $http) {
    var volumeId = $routeParams.id;
    $http.get('/getVolume?id='+volumeId).then(function (response) {
        $scope.volume = response.data;
    });
});
