(function (angular, _) {
	'use strict';

	angular.module('battlesnake.directive-proxy')
		.factory('directiveProxyService', directiveProxyService);

	function directiveProxyService($compile, $injector) {

		proxy.generateDirective = generateDirective;
		proxy.generateAlias = generateAlias;

		return proxy;

		function proxy(target, attrActions, scope, element, attrs) {
			/* Ensure target exists (dependency check) */
			var targetName = target
				.replace(/[\s\-\:_]+\w/g, function (s) {
					return s.charAt(s.length - 1).toUpperCase();
				}) + 'Directive';
			try {
				$injector.get(targetName);
			} catch (e) {
				console.error('Target directive not found or could not be injected: ' + target);
				throw e;
			}
			/* Create new element */
			var forward = angular.element('<' + target + '/>');
			/* Parse attribute actions */
			if (!attrActions) {
				attrActions = {};
			} else if (attrActions instanceof Array) {
				attrActions = _(attrActions).reduce(function (memo, attr) {
					memo[attr] = 'leave';
					return memo;
				}, {});
			} else {
				attrActions = _(attrActions).clone();
			}
			if (!_(attrActions).has('class')) {
				attrActions['class'] = 'leave';
			}
			if (!_(attrActions).has('id')) {
				attrActions.id = 'leave';
			}
			/* Move attributes over */
			_(attrs).chain()
				.omit(function (val, key) { return key.charAt(0) === '$'; })
				.each(function (val, key) {
					var action = _(attrActions).has(key) ? attrActions[key] : 'move';
					var attr = _(attrs.$attr).has(key) ? attrs.$attr[key] : key;
					if (action === 'remove' || action === 'move') {
						element.removeAttr(attr);
					}
					if (action === 'copy' || action === 'move') {
						forward.attr(attr, val);
					}
					if (action.charAt(0) === '=') {
						forward.attr(attr, action.substr(1));
					}
				});
			/* Compile */
			$compile(forward)(scope);
			/* Append to parent */
			element.append(forward);
			return forward;
		}

		/* Generates a proxy directive to be returned by a directive */
		function generateDirective(tag, link, require) {
			return {
				restrict: 'E',
				require: require,
				terminal: true,
				priority: 1000000,
				replace: true,
				template: '<' + tag + '></' + tag + '>',
				link: link
			};
		}

		/* Generate an alias directive, within the given container */
		function generateAlias(tag, target) {
			return directiveProxyService.generateDirective(
				tag,
				function link(scope, element, attrs) {
					directiveProxyService(target, null, scope, element, attrs);
				});
		}

	}

})(window.angular, window._);
