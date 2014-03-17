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

  var failMatch = function(){
    $scope.match = null;
    $scope.status = 'Match Failed!'
  };

  $scope.getMatchInfo = function(scheduledGuid){
    $http.get('/matches/' + scheduledGuid).success(function(response){
      $scope.status = 'Match Found!'
      $scope.match = response;
      if(response.timeRemaining > 0 && response.scheduled === 0){
        $timeout(function(){$scope.getMatchInfo(scheduledGuid)}, 1000);
      } else if(response.timeRemaining < 1 && response.scheduled === 0) {
        failMatch();
      }
    }).error(function(e){
      if($scope.match && !$scope.match.scheduled){
        failMatch();
      }
    });
  };

  $scope.acceptOrRejectMatch = function(scheduledGuid, requestGuid, wasAccepted){
    $http.put('/matches/' + scheduledGuid, {
      matchRequestGuid: requestGuid,
      accepted: wasAccepted
    });
  };
});
