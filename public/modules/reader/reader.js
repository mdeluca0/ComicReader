angular.module('reader', ['ngRoute', 'ngTouch']);

var currentIssue = {
    'volumeName': '',
    'volumeId': '',
    'issueName': '',
    'issueId': '',
    'pageCount': 0,
    'currentPageNo': 0,
    'currentPageImage': '',
    'loadedPages': []
};

var loadingImg = '/images/loading.gif';
var forwardPageLoad = 3;
var backwardsPageLoad = 1;

angular.module('reader').controller('readerCtrl', function($scope, $routeParams, $document, $window, $http) {
    var issueId = $routeParams.id;

    $http.get('/readIssue?id='+issueId+'&page=0').then(function (response) {
        currentIssue.volumeName = response.data.volumeName;
        currentIssue.volumeId = response.data.volumeId;
        currentIssue.issueName = response.data.issueName;
        currentIssue.issueId = response.data.issueId;
        currentIssue.pageCount = response.data.pageCount;
        currentIssue.currentPageNo = 0;
        currentIssue.currentPageImage = response.data.pageImage;
        currentIssue.loadedPages = Array.apply(null, Array(parseInt(response.data.pageCount))).map(function () {});
        currentIssue.loadedPages[0] = response.data.pageImage;

        $scope.currentIssue = currentIssue;


        var goToPage  = function ($http, pageNo) {
            if (pageNo <= 0) {
                pageNo = 0;
            }
            if (pageNo > currentIssue.pageCount - 1) {
                pageNo = currentIssue.pageCount - 1;
            }

            currentIssue.currentPageNo = pageNo;

            if (typeof(currentIssue.loadedPages[pageNo]) !== 'undefined') {
                currentIssue.currentPageImage = currentIssue.loadedPages[pageNo];
            } else {
                currentIssue.currentPageImage = loadingImg;
            }

            for (var i = pageNo; i < pageNo+forwardPageLoad; i++) {
                if (typeof(currentIssue.loadedPages[i]) === 'undefined') {
                    loadPage($http, currentIssue.issueId, i);
                }
            }
            for (i = pageNo-1; i >= pageNo-backwardsPageLoad; i--) {
                if (typeof(currentIssue.loadedPages[i]) === 'undefined') {
                    loadPage($http, currentIssue.issueId, i);
                }
            }
        };

        var loadPage = function ($http, issueId, pageNo) {
            $http.get('/readIssue?id='+issueId+'&page='+pageNo).then(function (response) {
                currentIssue.loadedPages[pageNo] = response.data.pageImage;
                if (currentIssue.issueId == issueId && pageNo == currentIssue.currentPageNo) {
                    currentIssue.currentPageImage = loadedPages[pageNo];
                }
            });
        };

        // Keyboard and Swipe Events
        var handleKeyDown = function(event) {
            switch (event.keyCode) {
                case 37: // [Left]
                    goToPage($http, currentIssue.currentPageNo-1);
                    break;
                case 39: // [Right]
                    goToPage($http, currentIssue.currentPageNo+1);
                    break;
            }
            $scope.$apply();
        };
        $document.on('keydown', handleKeyDown);
        $scope.$on('$destroy', function() {
            $document.unbind('keydown', handleKeyDown);
        });
        $scope.swipeLeft = function() {
            goToPage($http, currentIssue.currentPageNo+1);
        };
        $scope.swipeRight = function() {
            goToPage($http, currentIssue.currentPageNo-1);
        };
        $scope.touchClick = function () {
            goToPage($http, currentIssue.currentPageNo+1);
        };

        goToPage($http, currentIssue.currentPageNo);
    });
});