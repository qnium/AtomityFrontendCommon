'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var DataProvider = function () {
    function DataProvider() {
        _classCallCheck(this, DataProvider);

        this.sessionKey = null;
        this.apiEndpoint = null;
    }

    _createClass(DataProvider, [{
        key: 'executeAction',
        value: function executeAction(entity, action, payload) {
            var req = {
                entityName: entity,
                action: action,
                data: payload,
                sessionKey: this.sessionKey
            };
            return fetch(this.apiEndpoint, {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(req)
            }).then(function (response) {
                return response.json();
            }).then(function (result) {
                if (result.error) {
                    throw new Error(result.error);
                } else {
                    return result;
                }
            });
        }
    }, {
        key: 'init',
        value: function init(config) {
            this.apiEndpoint = config.apiEndpoint;
        }
    }, {
        key: 'setSessionKey',
        value: function setSessionKey(key) {
            this.sessionKey = key;
        }
    }]);

    return DataProvider;
}();

exports.default = new DataProvider();