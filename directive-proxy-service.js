(function (angular, _) {
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
	 * @param attrActions {array|object}
	 * Actions to apply to attributes of the host element.  If this is an array
	 * of attribute names it is equivalent to an object where each key is an
	 * attribute name and each value is "leave".
	 *
	 * Possible actions are:
	 *
	 *  * leave - leave the attribute on the host element
	 *  * copy - copy the attribute to the target element
	 *  * remove - remove the attribute from the host element
	 *  * move - move the attribute to the target element
	 *  * =value - set the attribute on the target element to "value"
	 *  * @attr - set the attribute on the target element to the value of
	 *    attribute attr on the source element
	 *
	 * @param scope {scope}
	 * The angular scope to compile the target element in
	 *
	 * @param element {element}
	 * The host element.  To replace the host element with the target, set
	 * `replace: true` in the host element's directive definition.
	 *
	 * @param attrs {attrs}
	 * Attributes of the host element
	 *
	 * @return {element}
	 * The compiled target element (already appended to the host element)
	 */
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
					var valid = false;
					if (action === 'leave') {
						valid = true;
					}
					if (action === 'remove' || action === 'move') {
						element.removeAttr(attr);
						valid = true;
					}
					if (action === 'copy' || action === 'move') {
						forward.attr(attr, val);
						valid = true;
					}
					if (action.charAt(0) === '=') {
						forward.attr(attr, action.substr(1));
						valid = true;
					}
					if (action.charAt(0) === '@') {
						var attr = action.substr(1);
						var value = _(attrs).has(attr) ? attrs[attr] :
							_(attrs.$attr).has(attr) ? attrs[attrs.$attr[attr]] :
							null;
						if (value !== null) {
							forward.attr(attr, value);
						}
						valid = true;
					}
					if (!valid) {
						throw new Error('Unknown attribute action: ' + action);
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
				/* Allow as attribute for shitty Microsoft browsers */
				restrict: 'EA',
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
