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
var forwardPageLoad = 5;
var backwardsPageLoad = 3;
var zoom = 100;

angular.module('reader').controller('readerCtrl', function($scope, $routeParams, $document, $window, $http) {
    var issueId = $routeParams.id;

    $http.get('/page?id='+issueId+'&page=0').then(function (response) {
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
            }

            var lookAhead = pageNo + forwardPageLoad  >=  currentIssue.pageCount ? currentIssue.pageCount : pageNo + forwardPageLoad;
            var lookBack = pageNo - backwardsPageLoad < 0 ? 0 : pageNo - backwardsPageLoad;

            for (var i = pageNo; i < lookAhead; i++) {
                if (typeof(currentIssue.loadedPages[i]) === 'undefined') {
                    loadPage($http, currentIssue.issueId, i);
                }
            }
            for (i = pageNo-1; i >= lookBack; i--) {
                if (typeof(currentIssue.loadedPages[i]) === 'undefined') {
                    loadPage($http, currentIssue.issueId, i);
                }
            }

            $('body').scrollTop(0);
            //$('body').animate({scrollTop: 0}, 2000);
        };

        var loadPage = function ($http, issueId, pageNo) {
            $http.get('/page?id='+issueId+'&page='+pageNo).then(function (response) {
                currentIssue.loadedPages[pageNo] = response.data.pageImage;
                if (currentIssue.issueId == issueId && pageNo == currentIssue.currentPageNo) {
                    currentIssue.currentPageImage = loadedPages[pageNo];
                    goToPage($http, currentIssue.currentPageNo);
                }
            });
        };

        $scope.fitToPage = function() {
            zoom = 100;
            $('#page-container').css('height', '90%');
        };
        $scope.zoomIn = function() {
            zoom += 10;
            $('#page-container').css('height', zoom + '%');
        };
        $scope.zoomOut = function() {
            zoom -= 10;
            $('#page-container').css('height', zoom + '%');
        };

        // Keyboard and Touch/Click Events
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
        $scope.touchLeft = function () {
            goToPage($http, currentIssue.currentPageNo-1);
        };
        $scope.touchRight = function () {
            goToPage($http, currentIssue.currentPageNo+1);
        };

        goToPage($http, currentIssue.currentPageNo);
    });
});