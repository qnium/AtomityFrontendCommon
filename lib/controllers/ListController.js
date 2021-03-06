'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.ListControllerEvents = exports.ListController = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _DataProviderRegistry = require('../services/DataProviderRegistry');

var _DataProviderRegistry2 = _interopRequireDefault(_DataProviderRegistry);

var _qniumEvents = require('qnium-events');

var _qniumEvents2 = _interopRequireDefault(_qniumEvents);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var ctrlNameCounter = 0;
var defaultCtrlName = "defaultCtrlName";

var ListControllerEvents = {
    // events handled by controller
    refresh: (0, _qniumEvents2.default)().create({ targetName: String }),
    deleteRecords: (0, _qniumEvents2.default)().create({ targetName: String, data: {} }),
    selectPage: (0, _qniumEvents2.default)().create({ targetName: String, data: Number }),
    applyFilter: (0, _qniumEvents2.default)().create({ targetName: String, data: {} }),
    sort: (0, _qniumEvents2.default)().create({ targetName: String, data: {} }),
    setRowChecked: (0, _qniumEvents2.default)().create({ targetName: String, data: {} }),
    setAllChecked: (0, _qniumEvents2.default)().create({ targetName: String, data: {} }),
    customAction: (0, _qniumEvents2.default)().create({ targetName: String, data: {} }),
    updateEntities: (0, _qniumEvents2.default)().create({ entitiesName: Array }),

    // events emitted by controller
    stateChanged: (0, _qniumEvents2.default)().create({ sourceName: String, data: {} })
};

var ListController = function () {
    function ListController(params) {
        var _this = this;

        _classCallCheck(this, ListController);

        // vars
        this.actionInProgress = false;
        this.pageData = [];
        this.totalRecords = 0;
        this.currentPage = 1;
        this.totalPages = 1;
        this.nextPageAvailable = false;
        this.prevPageAvailable = false;
        this.filters = {};
        this.currentSort = {};

        // params
        this.entitiesName = params.entitiesName;
        this.ctrlName = params.ctrlName || defaultCtrlName + ctrlNameCounter++;
        this.readAction = params.readAction || "read";
        this.deleteAction = params.deleteAction || "delete";
        this.pageDataLength = params.pageDataLength == 0 ? 0 : params.pageDataLength || 10;
        this.useDummyRows = params.useDummyRows;
        this.entityKeyField = params.entityKeyField || "id";
        this.dataProvider = _DataProviderRegistry2.default.get(params.dataProviderName);
        if (params.initFilters) {
            params.initFilters.forEach(function (filter) {
                _this.setFilter(filter);
            });
        }

        this.refreshHandlerRemover = (0, _qniumEvents2.default)(ListControllerEvents.refresh).handle(function (event) {
            _this.doAction(_this.refresh, event);
        });
        this.deleteRecordsHandlerRemover = (0, _qniumEvents2.default)(ListControllerEvents.deleteRecords).handle(function (event) {
            _this.doAction(_this.deleteRecord, event);
        });
        this.selectPageHandlerRemover = (0, _qniumEvents2.default)(ListControllerEvents.selectPage).handle(function (event) {
            _this.doAction(_this.selectPage, event);
        });
        this.applyFilterHandlerRemover = (0, _qniumEvents2.default)(ListControllerEvents.applyFilter).handle(function (event) {
            _this.doAction(_this.applyFilter, event);
        });
        this.sortHandlerRemover = (0, _qniumEvents2.default)(ListControllerEvents.sort).handle(function (event) {
            _this.doAction(_this.sortAction, event);
        });
        this.setRowCheckedHandlerRemover = (0, _qniumEvents2.default)(ListControllerEvents.setRowChecked).handle(function (event) {
            _this.doAction(_this.setRowCheckedAction, event);
        });
        this.setAllCheckedHandlerRemover = (0, _qniumEvents2.default)(ListControllerEvents.setAllChecked).handle(function (event) {
            _this.doAction(_this.setAllCheckedAction, event);
        });
        this.customActionHandlerRemover = (0, _qniumEvents2.default)(ListControllerEvents.customAction).handle(function (event) {
            _this.doAction(_this.customAction, event);
        });
        this.updateEntitiesHandlerRemover = (0, _qniumEvents2.default)(ListControllerEvents.updateEntities).handle(function (event) {
            return _this.updateEntities(event);
        });

        this.refresh();
    }

    _createClass(ListController, [{
        key: 'destroy',
        value: function destroy() {
            this.refreshHandlerRemover();
            this.deleteRecordsHandlerRemover();
            this.selectPageHandlerRemover();
            this.applyFilterHandlerRemover();
            this.sortHandlerRemover();
            this.setRowCheckedHandlerRemover();
            this.setAllCheckedHandlerRemover();
            this.customActionHandlerRemover();
            this.updateEntitiesHandlerRemover();
        }
    }, {
        key: 'getFilterName',
        value: function getFilterName(filter) {
            return filter.field + "-" + filter.operation;
        }
    }, {
        key: 'updateEntities',
        value: function updateEntities(entities) {
            var _this2 = this;

            if (entities && entities.filter(function (item) {
                return item === _this2.entitiesName;
            }).length > 0) {
                this.refresh();
            }
        }
    }, {
        key: 'doAction',
        value: function doAction(actionPerformer, params) {
            if (this.ctrlName === params.targetName) {
                actionPerformer.bind(this)(params.data);
            }
        }
    }, {
        key: 'deleteRecord',
        value: function deleteRecord(records) {
            var _this3 = this;

            this.setProgressState(true);
            this.dataProvider.executeAction(this.entitiesName, this.deleteAction, records).then(function (result) {
                _this3.setProgressState(false);
                _this3.refresh();
            }, function (err) {
                _this3.dataProvider.errorHandler(err.error, err);
            });
        }
    }, {
        key: 'customAction',
        value: function customAction(params) {
            var _this4 = this;

            this.setProgressState(true);
            this.dataProvider.executeAction(this.entitiesName, params.action, params.data).then(function (result) {
                _this4.setProgressState(false);
                _this4.refresh();
            }, function (err) {
                _this4.dataProvider.errorHandler(err.error, err);
            });
        }
    }, {
        key: 'setFilter',
        value: function setFilter(filter) {
            var filterName = this.getFilterName(filter);
            this.filters[filterName] = filter;
        }
    }, {
        key: 'applyFilter',
        value: function applyFilter(filter) {
            this.setFilter(filter);
            this.refresh();
        }

        // window.QEventEmitter.removeListener(this.refreshActionListener);

    }, {
        key: 'sortAction',
        value: function sortAction(sortParams) {
            var newSortingFilter = {
                field: sortParams.sortingField,
                operation: "sort"
            };

            var newFilterName = this.getFilterName(newSortingFilter);
            var currentSortingFilter = this.filters[newFilterName];

            if (currentSortingFilter) {
                if (sortParams.value !== undefined) {
                    newSortingFilter.value = sortParams.value;
                } else {
                    newSortingFilter.value = !currentSortingFilter.value;
                }
            } else {
                var newFilters = {};
                for (var key in this.filters) {
                    if (!key.endsWith("-sort")) {
                        newFilters[key] = this.filters[key];
                    }
                }
                newSortingFilter.value = true;
                this.filters = newFilters;
            }

            this.filters[newFilterName] = newSortingFilter;
            this.currentSort = {
                field: newSortingFilter.field,
                value: newSortingFilter.value
            };

            this.refresh();
        }
    }, {
        key: 'setRowCheckedAction',
        value: function setRowCheckedAction(params) {
            var item = this.pageData[params.rowIndex];
            item.checked = params.newState === undefined ? !item.checked : params.newState;
            this.sendStateChangedEvent();
        }
    }, {
        key: 'setAllCheckedAction',
        value: function setAllCheckedAction(params) {
            var newState = params && params.newState !== undefined ? params.newState : true;
            this.pageData.filter(function (item) {
                return !item.dummy;
            }).map(function (item) {
                return item.checked = newState;
            });
            this.sendStateChangedEvent();
        }
    }, {
        key: 'setProgressState',
        value: function setProgressState(newState) {
            if (this.actionInProgress !== newState) {
                this.actionInProgress = newState;
                this.sendStateChangedEvent();
            }
        }
    }, {
        key: 'sendStateChangedEvent',
        value: function sendStateChangedEvent() {
            (0, _qniumEvents2.default)(ListControllerEvents.stateChanged).send({ sourceName: this.ctrlName, data: this });
        }
    }, {
        key: 'updatePaginationInfo',
        value: function updatePaginationInfo() {
            this.totalPages = this.pageDataLength == 0 ? 1 : Math.ceil(this.totalRecords / this.pageDataLength);
            this.totalPages = Math.max(1, this.totalPages);
            this.nextPageAvailable = this.currentPage < this.totalPages;
            this.prevPageAvailable = this.currentPage > 1;
        }
    }, {
        key: 'selectPage',
        value: function selectPage(pageNumber) {
            this.currentPage = pageNumber;
            this.refresh();
        }
    }, {
        key: 'arrayDataToPageData',
        value: function arrayDataToPageData(arrayData) {
            var newPageData = arrayData.map(function (item, index) {
                return {
                    index: index,
                    checked: false,
                    data: item
                };
            });

            var self = this;
            newPageData.forEach(function (newItem) {
                var sameItems = self.pageData.filter(function (currentItem) {
                    return !currentItem.dummy && currentItem.data[self.entityKeyField] === newItem.data[self.entityKeyField];
                });
                if (sameItems[0] !== undefined) {
                    newItem.checked = sameItems[0].checked;
                }
            });

            return newPageData;
        }
    }, {
        key: 'addDummyRows',
        value: function addDummyRows() {
            for (var i = this.pageData.length; i < this.pageDataLength; i++) {
                this.pageData.push({ dummy: true });
            }
        }
    }, {
        key: 'refresh',
        value: function refresh() {
            var _this5 = this;

            this.setProgressState(true);

            var params = {
                filter: this.objectToArray(this.filters),
                startIndex: (this.currentPage - 1) * this.pageDataLength,
                count: this.pageDataLength
            };

            this.dataProvider.executeAction(this.entitiesName, this.readAction, params).then(function (result) {
                _this5.setProgressState(false);
                _this5.pageData = _this5.arrayDataToPageData(result.data);
                _this5.totalRecords = result.totalCounter;
                _this5.updatePaginationInfo();

                if (_this5.currentPage > 1 && _this5.pageData.length === 0) {
                    _this5.currentPage = _this5.totalPages;
                    _this5.refresh();
                } else {
                    if (_this5.useDummyRows === true) {
                        _this5.addDummyRows();
                    }
                    _this5.sendStateChangedEvent();
                }
            }, function (err) {
                _this5.dataProvider.errorHandler(err.error, err);
            });
        }
    }, {
        key: 'objectToArray',
        value: function objectToArray(obj) {
            var result = [];
            for (var key in obj) {
                result.push(obj[key]);
            }
            return result;
        }
    }]);

    return ListController;
}();

exports.ListController = ListController;
exports.ListControllerEvents = ListControllerEvents;