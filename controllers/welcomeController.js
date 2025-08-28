/* controllers/welcomeController.js
 * Versión clara (sin ofuscación). Maneja login y navegación inicial.
 */

/* global angular */

angular.module('app').controller('WelcomeController', function ($scope, Auth, Snackbar) {
  $scope.welcome = { isLoading: false, email: '', password: '' };

  $scope.login = async function login() {
    if ($scope.welcome.isLoading) return;
    $scope.welcome.isLoading = true;

    try {
      const res = await Auth.login({
        email: $scope.welcome.email,
        password: $scope.welcome.password,
      });

      if (res && res.status === 'success') {
        if (typeof $scope.toggleTab === 'function') $scope.toggleTab('collectMember');
      } else {
        Snackbar.show('Credenciales inválidas');
      }
    } catch (err) {
      Snackbar.show('No se pudo iniciar sesión. Revisa tu conexión.');
      // opcional: console.error(err);
    } finally {
      $scope.welcome.isLoading = false;
      $scope.welcome.password = '';
      $scope.$applyAsync();
    }
  };
});
