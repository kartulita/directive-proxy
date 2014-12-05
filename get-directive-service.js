(function (angular) {
	'use strict';

	angular.module('battlesnake.directive-proxy')
		.factory('getDirectiveService', getDirectiveService);

	/**
	 * @ngdoc service
	 * @name getDirectiveService
	 */
	function getDirectiveService($injector) {

		return getDirective;
		
		function getDirective(name, notFoundValue) {
			/* Ensure target exists (dependency check) */
			name = name
				.replace(/[\s\-\:_]+\w/g, function (s) {
					return s.charAt(s.length - 1).toUpperCase();
				}) + 'Directive';
			try {
				return $injector.get(name);
			} catch (e) {
				if (arguments.length < 2) {
					throw e;
				} else {
					return notFoundValue;
				}
			}
		}

	}

})(window.angular);
