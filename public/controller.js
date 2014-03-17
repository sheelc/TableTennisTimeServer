angular.module('tableTennisTime',[])
.controller('Controller', function ($scope, $http, $timeout){
  $scope.game = {numPlayers: 1, matchType: 'singles'};

  $scope.submit = function(game){
    $http.post('/match_requests', game).success(function(response){
      $scope.request_guid = response['guid'];
      $scope.status = 'Searching...';
      $scope.update($scope.request_guid);
    });
  };

  $scope.update = function(request_guid){
    $http.get('/match_requests/'+ request_guid).success(function(response){
      $scope.scheduled_guid = response['scheduledMatchGuid'];
      $scope.getMatchInfo($scope.scheduled_guid);
    }).error(function(e){
      $timeout(function(){$scope.update(request_guid)}, 1000);
    });
  };

  $scope.getMatchInfo = function(scheduledGuid){
    $http.get('/matches/' + scheduledGuid).success(function(response){
      $scope.status = 'Match Found!'
      $scope.match = response;
      $timeout(function(){$scope.getMatchInfo(scheduledGuid)}, 1000);
    });
  };
  
  $scope.acceptMatch = function(scheduledGuid, requestGuid){
    $http.put('/matches/' + scheduledGuid, {
      matchRequestGuid: requestGuid,
      accepted: 1
    })
  };

  $scope.rejectMatch = function(scheduledGuid, requestGuid){
    $scope.match
    $http.put('/matches/' + scheduledGuid, {
      matchRequestGuid: requestGuid,
      accepted: 0
    })
  }
});
