'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _DataProviderRegistry = require('../services/DataProviderRegistry');

var _DataProviderRegistry2 = _interopRequireDefault(_DataProviderRegistry);

var _ListController = require('./ListController');

var _qniumEvents = require('qnium-events');

var _qniumEvents2 = _interopRequireDefault(_qniumEvents);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var InputFilterController = function () {
    function InputFilterController(params) {
        _classCallCheck(this, InputFilterController);

        this.params = params;
        this.targetCtrl = this.params.targetListCtrlName;

        this.filter = {
            field: this.params.filteringField,
            operation: this.params.complexFilter ? "in" : this.params.filteringOperation || "like",
            value: undefined
        };

        this.dataProvider = _DataProviderRegistry2.default.get(params.dataProviderName);
    }

    _createClass(InputFilterController, [{
        key: 'applyFilter',
        value: function applyFilter(filterValue) {
            var _this = this;

            if (this.params.complexFilter) {
                var complexFilter = {
                    field: this.params.complexFilter.filteringField,
                    operation: this.params.complexFilter.filteringOperation || 'like',
                    value: filterValue
                };

                this.dataProvider.executeAction(this.params.complexFilter.entitiesName, this.params.complexFilter.readAction || "read", { filter: [complexFilter] }).then(function (result) {
                    _this.filter.value = result.data.map(function (item) {
                        return item[_this.params.complexFilter.key];
                    });
                    (0, _qniumEvents2.default)(_ListController.ListControllerEvents.applyFilter).send({ targetName: _this.targetCtrl, data: _this.filter });
                });
            } else {
                this.filter.value = filterValue;
                (0, _qniumEvents2.default)(_ListController.ListControllerEvents.applyFilter).send({ targetName: this.targetCtrl, data: this.filter });
            }
        }
    }]);

    return InputFilterController;
}();

exports.default = InputFilterController;