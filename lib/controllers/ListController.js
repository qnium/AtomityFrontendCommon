'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.ListControllerEvents = exports.ListController = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _FileDataProvider = require('../services/FileDataProvider');

var _FileDataProvider2 = _interopRequireDefault(_FileDataProvider);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var events = require('qnium-events');

var ListControllerEvents = {
    // actions
    refresh: events().create({ targetName: String }),
    deleteRecord: events().create({ targetName: String, data: Object }),
    editRecord: events().create({ targetName: String, data: Object }),
    selectPage: events().create({ targetName: String, data: Object }),
    applyFilter: events().create({ targetName: String, data: Object }),
    sort: events().create({ targetName: String, data: Object }),
    setRowChecked: events().create({ targetName: String, data: Object }),
    setAllChecked: events().create({ targetName: String, data: Object }),
    customAction: events().create({ targetName: String, data: Object }),
    updateEntities: events().create({ entitiesName: Array }),

    // events
    stateChanged: events().create({ sourceName: String, data: Object })
};

var ListController = function () {
    _createClass(ListController, null, [{
        key: 'defaultCtrlName',
        get: function get() {
            return "defaultCtrlName";
        }
    }]);

    function ListController(params) {
        var _this = this;

        _classCallCheck(this, ListController);

        if (!ListController.ctrlNameCounter) {
            ListController.ctrlNameCounter = 0;
        }

        _FileDataProvider2.default.init({ apiEndpoint: 'demoApi' });
        _FileDataProvider2.default.setSessionKey('demoSessionKey');

        // params
        if (params) {
            this.entitiesName = params.entitiesName;
            this.ctrlName = params.ctrlName || ListController.defaultCtrlName + ListController.ctrlNameCounter++;
            this.readAction = params.readAction || "read";
            this.deleteAction = params.deleteAction || "delete";
            this.pageDataLength = params.pageDataLength == 0 ? 0 : params.pageDataLength || 10;
            this.useDummyRows = params.useDummyRows;
            this.entityKeyField = params.entityKeyField || "id";
        }

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

        events(ListControllerEvents.refresh).handle(function (event) {
            _this.doAction(_this.refresh, event);
        });
        events(ListControllerEvents.deleteRecord).handle(function (event) {
            _this.doAction(_this.deleteRecord, event);
        });
        events(ListControllerEvents.editRecord).handle(function (event) {
            _this.doAction(_this.editRecord, event);
        });
        events(ListControllerEvents.selectPage).handle(function (event) {
            _this.doAction(_this.selectPage, event);
        });
        events(ListControllerEvents.applyFilter).handle(function (event) {
            _this.doAction(_this.applyFilter, event);
        });
        events(ListControllerEvents.sort).handle(function (event) {
            _this.doAction(_this.sortAction, event);
        });
        events(ListControllerEvents.setRowChecked).handle(function (event) {
            _this.doAction(_this.setRowCheckedAction, event);
        });
        events(ListControllerEvents.setAllChecked).handle(function (event) {
            _this.doAction(_this.setAllCheckedAction, event);
        });
        events(ListControllerEvents.customAction).handle(function (event) {
            _this.doAction(_this.customAction, event);
        });
        events(ListControllerEvents.updateEntities).handle(function (event) {
            return _this.updateEntities(event);
        });

        this.refresh();
    }

    _createClass(ListController, [{
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
        value: function deleteRecord(record) {
            var _this3 = this;

            this.setProgressState(true);
            _FileDataProvider2.default.executeAction(this.entitiesName, this.deleteAction, [record]).then(function (result) {
                _this3.setProgressState(false);
                _this3.refresh();
            });
        }
    }, {
        key: 'customAction',
        value: function customAction(params) {
            var _this4 = this;

            this.setProgressState(true);
            _FileDataProvider2.default.executeAction(this.entitiesName, params.action, params.payload).then(function (result) {
                _this4.setProgressState(false);
                _this4.refresh();
            });
        }
    }, {
        key: 'applyFilter',
        value: function applyFilter(filter) {
            var filterName = this.getFilterName(filter);
            this.filters[filterName] = filter;
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
            events(ListControllerEvents.stateChanged).send({ sourceName: this.ctrlName, data: this });
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

            _FileDataProvider2.default.executeAction(this.entitiesName, this.readAction, params).then(function (result) {
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
            });
        }
    }, {
        key: 'editRecord',
        value: function editRecord(entity) {
            console.log("ListCtrl - editRecord: ", entity);
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