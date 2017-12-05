angular.module('issue', ['ngRoute', 'ngSanitize']);

angular.module('issue').controller('issueCtrl', function($scope, $routeParams, $http, $sce) {
    var issueId = $routeParams.id;
    $http.get('/getIssue?id='+issueId).then(function (response) {
        $scope.issue = response.data;
        $scope.issue.description = $sce.trustAsHtml($scope.issue.description);
    });
});