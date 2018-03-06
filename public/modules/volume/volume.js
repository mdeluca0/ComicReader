angular.module('volume', ['ngRoute']);

angular.module('volume').controller('volumeCtrl', function($scope, $routeParams, $http) {
    var volumeId = $routeParams.id;
    $http.get('/volumes?id='+volumeId).then(function (response) {
        $scope.volume = response.data[0];
        for (var i = 0; i < $scope.volume.issues.length; i++) {
            $scope.volume.issues[i].display_name = $scope.volume.issues[i].name.substr(0, 20);
            if ($scope.volume.issues[i].name.length > 20) {
                $scope.volume.issues[i].display_name += '...';
            }
        }
    });
});
