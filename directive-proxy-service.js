(function (angular) {
	'use strict';

	angular.module('battlesnake.directive-proxy')
		.factory('directiveProxyService', directiveProxyService);

	/**
	 * @ngdoc service
	 * @name directiveProxyService
	 *
	 * @param target {string}
	 * Name of directive to proxy to (can be un-normalized)
	 *
	 * @param scope {scope}
	 * The angular scope to compile the target element in
	 *
	 * @param element {element}
	 * The host element.  To replace the host element with the target, set
	 * `replace: true` in the host element's directive definition.
	 *
	 * @return {element}
	 * The compiled target element (already appended to the host element)
	 */
	function directiveProxyService($compile, $injector, attributeTransferService, getDirectiveService) {

		proxy.generateDirective = generateDirective;
		proxy.generateAlias = generateAlias;

		return proxy;

		function proxyAttributes(source, attrs, target) {
			attributeTransferService.moveControllers(source, attrs, target);
			attributeTransferService(source, attrs, target,
				{
					id: 'leave',
					'class': 'leave'
				},
				'move');
		}

		function proxy(target, scope, element, attrs) {
			/* Ensure target exists (dependency check) */
			try {
				getDirectiveService(target);
			} catch (e) {
				console.error('Target directive not found or could not be injected: ' + target);
				throw e;
			}
			/* Create new element */
			var newElement = angular.element('<' + target + '/>');
			proxyAttributes(element, attrs, newElement);
			/* Compile */
			$compile(newElement)(scope);
			/* Append to parent */
			element.append(newElement);
			return newElement;
		}

		/* Generates a proxy directive to be returned by a directive */
		function generateDirective(tagFactory, link) {
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
						if (link) {
							link(scope, newElement, attrs, meta);
						}
					};
				}
			};
		}

		/* Generate an alias directive, within the given container */
		function generateAlias(tag, target) {
			return directiveProxyService.generateDirective(
				tag,
				function link(scope, element, attrs) {
					directiveProxyService(target, scope, element);
				});
		}

	}

})(window.angular);
