'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var DEFAULT_TIMEOUT = 20000;
var TIMEOUT_ERROR_MESSAGE = 'Request timed out. Please check your Internet connection.';

var DataProviderJSONService = function () {
    function DataProviderJSONService(params) {
        _classCallCheck(this, DataProviderJSONService);

        this.sessionKey = params.sessionKey;
        this.apiEndpoint = params.apiEndpoint;
        this.timeout = params.timeout || DEFAULT_TIMEOUT;
        this.errorHandler = params.errorHandler || function (errorMessage) {
            throw errorMessage;
        };
    }

    _createClass(DataProviderJSONService, [{
        key: 'executeAction',
        value: function executeAction(entity, action, data) {
            var _this = this;

            var req = {
                entityName: entity,
                action: action,
                data: data,
                sessionKey: this.sessionKey
            };
            var fetchPromise = fetch(this.apiEndpoint, {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(req)
            }).then(function (response) {
                return response.json();
            }).then(function (result) {
                if (result.error || result.errorCode) {
                    throw result;
                } else {
                    return result;
                }
            }).catch(function (err) {
                if (err.name === "TypeError" && err.message === "Failed to fetch") {
                    return Promise.reject({ error: "Server inaccessible" });
                } else {
                    throw err;
                }
            });

            var timeoutPromise = new Promise(function (resolve, reject) {
                setTimeout(function () {
                    return reject({ error: TIMEOUT_ERROR_MESSAGE });
                }, _this.timeout);
            });

            return Promise.race([fetchPromise, timeoutPromise]);
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

    return DataProviderJSONService;
}();

exports.default = DataProviderJSONService;