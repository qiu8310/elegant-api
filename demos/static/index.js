var EADemo = angular.module('EADemo', []);

function handleError(err) {
  return alert(JSON.stringify(err));
}

function clone(obj) {
  var res = {};
  for (var k in obj) res[k] = obj[k];
  return res;
}

function extend(src, target) {
  for (var k in target) src[k] = target[k];
}

EADemo.controller('UserCtrl', function ($scope) {

  $scope.target = {};
  $scope.userModal = $('#userModal');
  $scope.genders = {
    M: 'Male',
    F: 'Female'
  };
  $scope.years = new Array(50).fill(0).map(function (val, i) {
    return new Date().getFullYear() - i;
  });

  API.getAllUsers(function (err, users) {
    if (err) return handleError(err);
    $scope.users = users;
    $scope.$apply();
  });

  $scope.add = function () {
    // TODO API.$r.user();
    $scope.target = {uid: 0};
  };

  $scope.edit = function (e, user) {
    $scope.src = user;
    $scope.target = clone(user);
  };

  $scope.delete = function (user, index) {
    user.isDeleting = true;

    API.deleteUser(user, function (err, data) {
      user.isDeleting = false;
      if (err) return handleError(err);
      $scope.users.splice(index, 1);
      $scope.$apply();
    });
  };

  $scope.submit = function (user) {

    $scope.isSubmiting = true;
    var isCreateUser = user.uid === 0;

    API[isCreateUser ? 'createUser' : 'updateUser'](user, function (err, user) {
      $scope.isSubmiting = false;
      $scope.userModal.modal('toggle');
      console.log(user);
      if (err) handleError(err);
      else {
        if (isCreateUser) $scope.users.push(user);
        else extend($scope.src, $scope.target);
      }

      $scope.$apply();
    });

  };

});
