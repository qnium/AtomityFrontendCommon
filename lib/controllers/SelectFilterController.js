'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _FileDataProvider = require('../services/FileDataProvider');

var _FileDataProvider2 = _interopRequireDefault(_FileDataProvider);

var _ListController = require('./ListController');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var events = require('qnium-events');

var SelectFilterController = function () {
    function SelectFilterController(params) {
        _classCallCheck(this, SelectFilterController);

        var self = this;
        this.params = params;

        this.targetCtrl = this.params.targetListCtrlName;
        this.readAction = this.params.readAction || "read";

        this.filter = {
            field: this.params.filteringField,
            operation: 'eq',
            value: undefined
        };

        this.listCtrl = new _ListController.ListController({
            ctrlName: this.params.listCtrlName,
            entitiesName: this.params.entitiesName,
            readAction: this.readAction,
            pageDataLength: 0
        });
    }

    _createClass(SelectFilterController, [{
        key: 'applyFilter',
        value: function applyFilter(filterValue) {
            this.filter.value = filterValue;
            events(_ListController.ListControllerEvents.applyFilter).send({ targetName: this.targetCtrl, data: this.filter });
        }
    }]);

    return SelectFilterController;
}();

exports.default = SelectFilterController;