(function (angular) {
	'use strict';

	angular.module('battlesnake.directive-proxy')
		.factory('directiveProxyService', directiveProxyService);

	/**
	 * @ngdoc service
	 * @name directiveProxyService
	 *
	 * @param {string} tagFactory
	 * Name of HTML tag for new element or a function(attrs, meta) which
	 * returns the name of the HTML tag.
	 *
	 * @param {array} leave
	 * Array of names of attributes to leave on the parent element
	 *
	 * @param {function} link
	 * A function(scope, element, attrs, meta) which links the new element,
	 * and optionally returns the name of a directive which should be proxied
	 * to (can be un-normalized).
	 *
	 * @return {directive}
	 * A directive definition which may be returned by a directive function.
	 *
	 */
	function directiveProxyService($compile, $injector, attributeTransferService, getDirectiveService) {

		generateDirective.alias = generateAlias;

		return generateDirective;

		/* Generates a proxy directive to be returned by a directive */
		function generateDirective(tagFactory, leave, link) {
			return {
				/* Allow as attribute for shitty Microsoft browsers */
				restrict: 'EA',
				multiElement: true,
				replace: true,
				priority: 1000000,
				terminal: true,
				compile: function (element, attrs) {
					var originalTag = element.prop('nodeName').toLowerCase();
					var meta = {};
					var tag;
					if (typeof tagFactory === 'string') {
						tag = tagFactory;
					} else if (typeof tagFactory === 'function') {
						tag = '<' + tagFactory(attrs, meta) + '/>';
					} else {
						throw new Error('Invalid tag factory: ' + tagFactory);
					}
					var newElement = angular.element('<' + tag + '/>');
					proxyAttributes(element, attrs, newElement);
					element
						.append('<!-- ' + originalTag + '-->')
						.append(newElement);
					return function (scope, element, attrs) {
						var target = link(scope, newElement, attrs, meta);
						proxy(target, scope, newElement, attrs, leave || []);
					};
				}
			};
		}

		/* Generate an alias directive, within the given container */
		function generateAlias(tag, target) {
			return generateDirective(
				tag,
				[],
				function link(scope, element, attrs) {
					proxy(target, scope, element, []);
				});
		}

		/*
		 * Move controllers to target element, move attributes not listed in the
		 * `leave` array to the target element
		 */
		function proxyAttributes(source, attrs, target, leave) {
			attributeTransferService.moveControllers(source, attrs, target);
			var actions = _(leave)
				.reduce(function (memo, item) {
					memo[item] = 'leave';
					return memo;
				}, {});
			attributeTransferService(source, attrs, target, actions, 'move');
		}

		function proxy(target, scope, element, attrs, leave) {
			/* Ensure target exists (dependency check) */
			try {
				getDirectiveService(target);
			} catch (e) {
				console.error('Target directive not found or could not be injected: ' + target);
				throw e;
			}
			/* Create new element */
			var newElement = angular.element('<' + target + '/>');
			proxyAttributes(element, attrs, newElement, leave);
			/* Compile */
			$compile(newElement)(scope);
			/* Append to parent */
			element.append(newElement);
			return newElement;
		}

	}

})(window.angular);
