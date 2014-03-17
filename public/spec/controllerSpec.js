describe('Controller', function(){
  var controller,
    $scope,
    httpBackend,
    timeout;

  beforeEach(module('tableTennisTime'));

  beforeEach(inject(function($controller, $rootScope, $httpBackend, $timeout) {
    $scope = $rootScope.$new();
    timeout = $timeout;
    httpBackend = $httpBackend;
    controller = $controller('Controller', {
      $scope: $scope
    });
  }));

  afterEach(function() {
    httpBackend.verifyNoOutstandingExpectation();
    httpBackend.verifyNoOutstandingRequest();
  });

  it('sets defaults for the game', function(){
    expect($scope.game).toEqual({numPlayers: 1, matchType: 'singles'});
  });

  describe('submitting a game request', function(){
    beforeEach(function(){
      spyOn($scope, 'update');
      httpBackend.expectPOST('/match_requests', $scope.game).respond(200, {guid: '123'});
      $scope.submit($scope.game);
      httpBackend.flush();
    });

    it('saves the request guid', function(){
      expect($scope.request_guid).toEqual('123');
    });

    it('alerts the user that it is searching for a match', function(){
      expect($scope.status).toEqual('Searching...');
    });

    it('updates the status of the game request', function(){
      expect($scope.update).toHaveBeenCalledWith('123');
    });
  });

  describe('updating the status of a game request', function(){
    beforeEach(function() {
      spyOn($scope, 'update').and.callThrough();
    });

    describe('when the match is not ready yet', function(){
      beforeEach(function(){
        httpBackend.expectGET('/match_requests/123').respond(304);
        $scope.update('123');
        httpBackend.flush();
      });

      it('updates the status every second', function(){
        expect($scope.update.calls.count()).toEqual(1);
        httpBackend.expectGET('/match_requests/123').respond(304);
        timeout.flush(1000);
        expect($scope.update.calls.count()).toEqual(2);
        httpBackend.flush();
      });
    });

    describe('when the match is ready', function(){
      beforeEach(function(){
        spyOn($scope, 'getMatchInfo');
        httpBackend.expectGET('/match_requests/123').respond(200, { scheduledMatchGuid: '456'} );
        $scope.update('123');
        httpBackend.flush();
      });

      it('saves the scheduled match\'s guid', function(){
        expect($scope.scheduled_guid).toEqual('456');
      });

      it('requests information about the scheduled match', function() {
        expect($scope.getMatchInfo).toHaveBeenCalledWith('456');
      });
    });
  });

  describe('updating the status of a scheduled match', function(){
    beforeEach(function(){
      spyOn($scope, 'getMatchInfo').and.callThrough();
      httpBackend.expectGET('/matches/456').respond({foo: 'bar'});
      $scope.getMatchInfo('456');
      httpBackend.flush();
    });

    it('alerts the user that a game was found', function(){
      expect($scope.status).toEqual('Match Found!')
    });

    it('saves the match information', function(){
      expect($scope.match).toEqual({foo: 'bar'});
    });

    it('updates the status every second', function(){
      expect($scope.getMatchInfo.calls.count()).toEqual(1);
      httpBackend.expectGET('/matches/456').respond({foo: 'bar'});
      timeout.flush(1000);
      expect($scope.getMatchInfo.calls.count()).toEqual(2);
      httpBackend.flush();
    });

    //stop updating at timeout or accept
    //countdown
  });

  describe('accepting a scheduled match', function(){
    it('notifies the server that you accepted the match', function(){
      httpBackend.expectPUT('/matches/456', { matchRequestGuid: '123', accepted: 1 })
        .respond(200, {});
      $scope.acceptMatch('456', '123');
      httpBackend.flush();
    });
  });

  describe('rejecting a scheduled match', function(){
    it('notifies the server that you rejected the match', function(){
      httpBackend.expectPUT('/matches/456', { matchRequestGuid: '123', accepted: 0 })
        .respond(200, {});
      $scope.rejectMatch('456', '123');
      httpBackend.flush();
    });
  });

});
