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
    var response;
    beforeEach(function(){
      spyOn($scope, 'getMatchInfo').and.callThrough();
      response = {foo: 'bar', timeRemaining: 40, scheduled: 0};
      httpBackend.expectGET('/matches/456').respond(response);
      $scope.getMatchInfo('456');
      httpBackend.flush();
    });

    it('alerts the user that a game was found', function(){
      expect($scope.status).toEqual('Match Found!')
    });

    it('saves the match information', function(){
      expect($scope.match).toEqual(response);
    });

    it('updates the status every second', function(){
      expect($scope.getMatchInfo.calls.count()).toEqual(1);
      httpBackend.expectGET('/matches/456').respond(response);
      timeout.flush(1000);
      expect($scope.getMatchInfo.calls.count()).toEqual(2);
      httpBackend.flush();
    });

    it('stops updating if the match is scheduled', function(){
      response.scheduled = 1;
      httpBackend.expectGET('/matches/456').respond(response);
      timeout.flush(1000);
      expect($scope.getMatchInfo.calls.count()).toEqual(2);
      httpBackend.flush();

      timeout.flush(1000);
      expect($scope.getMatchInfo.calls.count()).toEqual(2);
      expect($scope.match).not.toBeNull();
      expect($scope.status).not.toEqual('Match Failed!');
    });

    it('stops updating if the match times out', function(){
      response.timeRemaining = 0;
      httpBackend.expectGET('/matches/456').respond(response);
      timeout.flush(1000);
      expect($scope.getMatchInfo.calls.count()).toEqual(2);
      httpBackend.flush();

      timeout.flush(1000);
      expect($scope.getMatchInfo.calls.count()).toEqual(2);
      expect($scope.match).toBeNull();
      expect($scope.status).toEqual('Match Failed!');
    });

    describe('when there is an error', function(){
      it('removes the match if there is no scheduled match', function(){
        httpBackend.expectGET('/matches/456').respond(404);
        timeout.flush(1000);
        httpBackend.flush();

        expect($scope.match).toBeNull();
        expect($scope.status).toEqual('Match Failed!');
      });

      it('does not remove the match if there is a scheduled match', function(){
        $scope.match = {scheduled: 1};
        httpBackend.expectGET('/matches/456').respond(404);
        timeout.flush(1000);
        httpBackend.flush();

        expect($scope.match).not.toBeNull();
        expect($scope.status).not.toEqual('Match Failed!');
      });
    });
  });

  describe('accepting a scheduled match', function(){
    it('notifies the server that you accepted the match', function(){
      httpBackend.expectPUT('/matches/456', { matchRequestGuid: '123', accepted: 1 })
        .respond(200, {});
      $scope.acceptOrRejectMatch('456', '123', 1);
      httpBackend.flush();
    });
  });

  describe('rejecting a scheduled match', function(){
    it('notifies the server that you rejected the match', function(){
      httpBackend.expectPUT('/matches/456', { matchRequestGuid: '123', accepted: 0 })
        .respond(200, {});
      $scope.acceptOrRejectMatch('456', '123', 0);
      httpBackend.flush();
    });
  });

});
