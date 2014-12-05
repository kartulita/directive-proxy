(function (angular, _) {
	'use strict';

	angular.module('battlesnake.directive-proxy')
		.factory('attributeTransferService', attributeTransferService);

	/**
	 * @ngdoc service
	 * @name attributeTransferService
	 *
	 * @description
	 * Transfer attributes from an one angular element to another
	 *
	 * @param source {element}
	 * The source element
	 *
	 * @param attrs {attrs}
	 * The attributes of the source element
	 *
	 * @param target {element}
	 * The target element
	 *
	 * @param spec {object}
	 * Actions to apply to attributes of the host element.
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
	 * @param [spec] {string}
	 * Default action to apply to an attribute if no action is specified in the
	 * `spec` parameter.  Defaults to "leave".
	 */
	function attributeTransferService($compile, $injector, getDirectiveService) {

		transferAttributes.moveControllers = moveControllers;

		return transferAttributes;

		function moveControllers(source, attrs, target) {
			transferAttributes(source, attrs, target,
				_(attrs).chain()
					.pairs()
					.omit(function (kv) { return kv[0].charAt(0) === '$'; })
					.filter(function (kv) { return getDirectiveService(kv[0], false); })
					.map(function (kv) { return [kv[0], 'move']; })
					.object()
					.value());
		}

		function transferAttributes(source, attrs, target, spec, defaultAction) {
			if (typeof defaultAction !== 'string') {
				defaultAction = 'leave';
			}
			/* Move attributes over */
			_(attrs).chain()
				.omit(function (val, key) { return key.charAt(0) === '$'; })
				.each(function (val, key) {
					var action = _(spec).has(key) ? spec[key] : defaultAction;
					var attr = _(attrs.$attr).has(key) ? attrs.$attr[key] : key;
					var valid = false;
					if (action === 'leave') {
						valid = true;
					}
					if (action === 'remove' || action === 'move') {
						source.removeAttr(attr);
						valid = true;
					}
					if (action === 'copy' || action === 'move') {
						target.attr(attr, val);
						valid = true;
					}
					if (action.charAt(0) === '=') {
						target.attr(attr, action.substr(1));
						valid = true;
					}
					if (action.charAt(0) === '@') {
						var attr = action.substr(1);
						var value = _(attrs).has(attr) ? attrs[attr] :
							_(attrs.$attr).has(attr) ? attrs[attrs.$attr[attr]] :
							null;
						if (value !== null) {
							target.attr(attr, value);
						}
						valid = true;
					}
					if (!valid) {
						throw new Error('Unknown attribute action: ' + action);
					}
				});
		}

	}

})(window.angular, window._);
