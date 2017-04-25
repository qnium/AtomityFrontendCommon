"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var DataProviderRegistry = function () {
    function DataProviderRegistry() {
        _classCallCheck(this, DataProviderRegistry);

        this.defaultName = "defaultDataProvider";
        this.dataProviders = [];
    }

    _createClass(DataProviderRegistry, [{
        key: "add",
        value: function add(dataProvider, name) {
            var key = name || this.defaultName;
            if (this.dataProviders[key] != undefined) {
                throw new Error("Data provider with name \"" + key + "\" already exists.");
            }
            this.dataProviders[key] = dataProvider;
        }
    }, {
        key: "get",
        value: function get(name) {
            var key = name || this.defaultName;
            return this.dataProviders[key];
        }
    }]);

    return DataProviderRegistry;
}();

exports.default = new DataProviderRegistry();