angular.module('issue', ['ngRoute', 'ngSanitize']);

angular.module('issue').controller('issueCtrl', function($scope, $routeParams, $http, $sce) {
    var issueId = $routeParams.id;
    $http.get('/issues?id='+issueId).then(function (response) {
        $scope.issue = response.data[0];
        $scope.issue.issues.description = $sce.trustAsHtml($scope.issue.issues.description);
    });
});