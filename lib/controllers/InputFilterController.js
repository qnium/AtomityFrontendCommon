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
        var _this = this;

        _classCallCheck(this, InputFilterController);

        var self = this;
        this.params = params;
        this.targetCtrl = this.params.targetListCtrlName;
        this.lastComplexFltVal = null;

        this.filter = {
            field: this.params.filteringField,
            operation: this.params.complexFilter ? "in" : this.params.filteringOperation || "like",
            value: undefined
        };

        this.dataProvider = _DataProviderRegistry2.default.get(params.dataProviderName);

        if (this.params.complexFilter) {
            (0, _qniumEvents2.default)(_ListController.ListControllerEvents.updateEntities).handle(function (event) {
                var entitiesToUpdate = event.find(function (item) {
                    return item === self.params.complexFilter.relatedEntities;
                });
                if (entitiesToUpdate) {
                    self.applyFilter(_this.lastComplexFltVal);
                    console.log("InpFlt", entitiesToUpdate);
                }
            });
        }
    }

    _createClass(InputFilterController, [{
        key: 'applyFilter',
        value: function applyFilter(filterValue) {
            var _this2 = this;

            if (this.params.complexFilter) {
                this.lastComplexFltVal = filterValue;
                var complexFilter = {
                    field: this.params.complexFilter.filteringField,
                    operation: this.params.complexFilter.filteringOperation || 'like',
                    value: filterValue
                };

                this.dataProvider.executeAction(this.params.complexFilter.entitiesName, this.params.complexFilter.readAction || "read", { filter: [complexFilter] }).then(function (result) {
                    _this2.filter.value = result.data.map(function (item) {
                        return item[_this2.params.complexFilter.key];
                    });
                    (0, _qniumEvents2.default)(_ListController.ListControllerEvents.applyFilter).send({ targetName: _this2.targetCtrl, data: _this2.filter });
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