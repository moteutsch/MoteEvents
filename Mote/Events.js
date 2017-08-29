var Mote = Mote || {};

Mote.Events = {
    apply: function (object) {
        var callbacks = [];
        var triggered = {};

        object.on = function (event, callback, contextOrPriority, context) {
            if (typeof callback !== 'function') {
                return this;
            }
            if (typeof callbacks[event] !== 'object') {
                callbacks[event] = [];
            }
            var priority = 1;
            if (typeof contextOrPriority === 'number') {
                priority = contextOrPriority;
            } else {
                context = contextOrPriority;
            }

            var identifier = Math.random().toString(36).substring(2);
            callbacks[event].push({
                callback: callback,
                context: context,
                identifier: identifier,
                priority: priority
            });

            return identifier;
        };
        object.off = function (event, identifier) {
            var list, i;

            list = callbacks[event];
            for (i = 0; i < callbacks.length; i--) {
                if (list[i].identifier === identifier) {
                    list[i].splice(i, 1);
                    break;
                }
            }

            return this;
        };
        object.after = function (event, callback, context, andOn) {
            andOn = andOn || false;
            if (typeof callback !== 'function') {
                return this;
            }
            if (typeof triggered[event] !== 'undefined') {
                callback.call(context, triggered[event].data);
                if (!andOn) {
                    return this;
                }
            }
            return object.on(event, callback, context);
        };
        object.onAndAfter = function (event, callback, context) {
            return object.after(event, callback, context, true);
        };
        object.trigger = function (event, data) {
            var list, i;

            triggered[event] = {
                data: data
            };

            list = (callbacks[event] || []).concat(callbacks['*'] || []);
            list = _.sortBy(list, function (item) {
                return -item.priority;
            });
            for (i = 0; i < list.length; i++) {
                list[i].callback.call(list[i].context, data, event);
            }
            list = [];

            return this;
        };
        object.refire = function (fromObject, event, asEvent) {
            if (typeof event === 'object') {
                var identifiers = {};
                _.each(event, function (asEvent, event) {
                    identifiers[event] = object.refire(fromObject, event, asEvent);
                });
                return identifiers;
            }
            if (typeof asEvent !== 'string') {
                asEvent = event;
            }
            return fromObject.on(event, function () {
                var params = Array.prototype.slice.call(arguments, 0);
                params.splice(-1, 1, asEvent);
                object.trigger.apply(object, [asEvent].concat(params));
            });
        };
        object.refireAll = function (fromObject, prefix) {
            return fromObject.on('*', function () {
                var params = Array.prototype.slice.call(arguments, 0);
                var asEvent = (prefix ? prefix + ':' : '') + params.splice(-1, 1);
                object.trigger.apply(object, [asEvent].concat(params));
            });
        };
        object.bind = object.on;
        object.unbind = object.off;
    }
};
