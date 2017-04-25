'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
 * Provides access to backend API.
 */
var FileDataProvider = function () {
    function FileDataProvider() {
        _classCallCheck(this, FileDataProvider);

        /**
         * Session key for requests that need authorization.
         */
        this.sessionKey = null;

        /**
         * Configuration for data provider.
         */
        this.providerConfig = null;

        this.storage = {};

        this.jsonFolder = "test_data";

        this.relatedEntityParameters = null;

        this.actions = {
            'read': this.getEntityData.bind(this),
            'create': this.createEntity.bind(this),
            'update': this.updateEntity.bind(this),
            'delete': this.deleteEntity.bind(this),
            'validators': this.getValidators.bind(this),
            'readRelatedEntities': this.getRelatedEntityData.bind(this),
            'createReadRequest': this.createReadRequest.bind(this)
        };
    }

    _createClass(FileDataProvider, [{
        key: 'executeAction',
        value: function executeAction(entityName, action, data) {
            return this.actions[action](entityName, data);
        }
    }, {
        key: 'createReadRequest',
        value: function createReadRequest(entityName, data) {
            var req = {
                entityName: entityName,
                sessionKey: this.sessionKey,
                data: data
            };

            return req;
        }

        /**
         * Action functions.
         * Begin
         */

    }, {
        key: 'getEntityData',
        value: function getEntityData(entityName, data) {
            var _this = this;

            var req = this.createReadRequest(entityName, data);
            var loaded = this.storage[entityName] ? this.getPromiseWithScopeDigest() : this.loadEntitiesFromJson(entityName);
            return loaded.then(function () {
                return _this.fillRelatedEntities(entityName).then(function () {
                    return _this.getPreparedEntityDataForReadAction(req, entityName);
                });
            });
        }
    }, {
        key: 'getRelatedEntityData',
        value: function getRelatedEntityData(entityName, data) {
            var _this2 = this;

            var req = this.createReadRequest(entityName, data);
            var loaded = this.storage[entityName] ? this.getPromiseWithScopeDigest() : this.loadEntitiesFromJson(entityName);
            return loaded.then(function () {
                return _this2.getPreparedEntityDataForRelatedReadAction(req, entityName);
            });
        }
    }, {
        key: 'getValidators',
        value: function getValidators(entityName) {
            var _this3 = this;

            return this.getPromiseWithScopeDigest(function () {
                return _this3.getEmptyDataWithTotalCount(entityName);
            });
        }
    }, {
        key: 'createEntity',
        value: function createEntity(entityName, record) {
            var _this4 = this;

            record = record.entity ? record.entity : record;
            this.addToStoredEntities(record, entityName);
            return this.fillRelatedEntities(entityName).then(function () {
                return _this4.getEmptyDataWithTotalCount(entityName);
            });
        }
    }, {
        key: 'updateEntity',
        value: function updateEntity(entityName, records) {
            var _this5 = this;

            records = records.entities ? records.entities : records;
            this.updateStoredEntities(records, entityName);
            return this.fillRelatedEntities(entityName).then(function () {
                return _this5.getEmptyDataWithTotalCount(entityName);
            });
        }
    }, {
        key: 'deleteEntity',
        value: function deleteEntity(entityName, records) {
            var _this6 = this;

            records = records.entities ? records.entities : records;
            this.deleteFromStoredEntities(records, entityName);
            return this.getPromiseWithScopeDigest(function () {
                return _this6.getEmptyDataWithTotalCount(entityName);
            });
        }
        /**
         * Action functions.
         * End
         */

    }, {
        key: 'loadEntitiesFromJson',
        value: function loadEntitiesFromJson(entityName) {
            var self = this;
            return fetch(this.jsonFolder + '/' + entityName + '.json').then(function (response) {
                return response.json();
            }).then(function (response) {
                self.storage[entityName] = response;
                return self.fillRelatedEntities(entityName);
            });
        }
    }, {
        key: 'fillRelatedEntities',
        value: function fillRelatedEntities(entityName) {
            var _this7 = this;

            var promices = [];
            var relationships = this.storage[entityName].relationships;
            relationships.forEach(function (relationship, i, arr) {
                promices.push(_this7.getEntityData(relationship.relatedEntity, {}).then(function (result) {
                    var relatedEntities = result.data;
                    return _this7.storage[entityName].records.forEach(function (entity, i, arr) {
                        entity[relationship.relatedEntity] = relatedEntities.find(function (relatedEntity, index, array) {
                            return entity[relationship.field] == relatedEntity[relationship.relatedEntityField];
                        });
                    });
                }));
            });
            return Promise.all(promices);
        }
    }, {
        key: 'getPromiseWithScopeDigest',
        value: function getPromiseWithScopeDigest(resolve) {
            return new Promise(function (resolve) {
                setTimeout(function () {
                    resolve();
                }, 1000);
            });
        }
    }, {
        key: 'getPreparedEntityDataForReadAction',
        value: function getPreparedEntityDataForReadAction(req, entityName) {
            var data = this.getRequestedEntities(req, entityName);
            return data;
        }
    }, {
        key: 'getPreparedEntityDataForRelatedReadAction',
        value: function getPreparedEntityDataForRelatedReadAction(req, entityName) {
            var data = this.getEmptyDataWithTotalCount(entityName);
            data.data = this.getFilteredEntitiesFrom(this.storage[entityName].records, [req.data]).map(function (entity) {
                return entity.id;
            });
            return data;
        }
    }, {
        key: 'getEmptyDataWithTotalCount',
        value: function getEmptyDataWithTotalCount(entityName) {
            var data = {};
            data.totalCounter = this.storage[entityName].records.length;
            return data;
        }
    }, {
        key: 'getRequestedEntities',
        value: function getRequestedEntities(req, entityName) {
            var newEntities = this.storage[entityName].records;
            if (req.data.filter) {
                newEntities = this.getFilteredEntitiesFrom(newEntities, req.data.filter);
            }
            var data = { totalCounter: newEntities.length };
            newEntities = this.getPagedEntitiesFrom(newEntities, req.data.startIndex, req.data.startIndex + req.data.count);
            data.data = newEntities;
            return data;
        }
    }, {
        key: 'getFilteredEntitiesFrom',
        value: function getFilteredEntitiesFrom(oldEntities, filters) {
            var newEntities = Object.create(oldEntities);

            filters.forEach(function (filter, i, arr) {

                var field = filter.field;
                var operation = filter.operation;
                var value = filter.value;

                if (operation === 'sort') {

                    var isNestedEntity = field.split('.').length > 1;
                    var firstField;
                    var nestedField;
                    if (isNestedEntity) {
                        firstField = field.split('.')[0];
                        nestedField = field.split('.')[1];
                    }

                    newEntities.sort(function (a, b) {
                        if (isNestedEntity) {
                            a = a[firstField][nestedField];
                            b = b[firstField][nestedField];
                        } else {
                            a = a[field];
                            b = b[field];
                        }
                        var result = 0;
                        if (a > b) {
                            result = 1;
                        } else if (a < b) {
                            result = -1;
                        }
                        return value ? result : -result;
                    });
                } else if (operation === 'like' && value) {
                    var likeValue = value;
                    if (!Array.isArray(likeValue)) {
                        likeValue = [likeValue];
                    }
                    var filteredEntities = [];
                    likeValue.forEach(function (v, i, arr) {
                        v = v.trim();
                        if (v) {
                            filteredEntities = filteredEntities.concat(newEntities.filter(function (entity) {
                                return entity[field].search(v) !== -1;
                            }));
                        }
                    });
                    newEntities = filteredEntities;
                } else if (operation === 'in' && value) {
                    newEntities = newEntities.filter(function (entity) {
                        return value.find(function (relatedEntityValue, index, array) {
                            return entity[field] == relatedEntityValue;
                        }) !== undefined;
                    });
                } else if (operation === 'eq' && value) {
                    newEntities = newEntities.filter(function (entity) {
                        return entity[field] == value;
                    });
                } else if (operation === 'date_ge' && value) {
                    try {
                        var unixTime = value.format("x");
                        newEntities = newEntities.filter(function (entity) {
                            return entity[field] >= unixTime;
                        });
                    } catch (ex) {}
                } else if (operation === 'date_le' && value) {
                    try {
                        var unixTime = value.format("x");
                        newEntities = newEntities.filter(function (entity) {
                            return entity[field] <= unixTime;
                        });
                    } catch (ex) {}
                }
            });
            return newEntities;
        }
    }, {
        key: 'getPagedEntitiesFrom',
        value: function getPagedEntitiesFrom(oldEntities, fromIndex, toIndex) {
            if (fromIndex < toIndex) {
                return oldEntities.slice(fromIndex, toIndex);
            } else {
                return oldEntities;
            }
        }
    }, {
        key: 'deleteFromStoredEntities',
        value: function deleteFromStoredEntities(entitiesToDelete, entityName) {
            this.storage[entityName].records = this.storage[entityName].records.filter(function (e) {
                return entitiesToDelete.find(function (entityToBeDeleted, index, array) {
                    return e.id === entityToBeDeleted.id;
                }) === undefined;
            });
        }
    }, {
        key: 'addToStoredEntities',
        value: function addToStoredEntities(record, entityName) {
            var newEntity = Object.create(record);
            var entities = this.storage[entityName].records;
            newEntity.id = entities[entities.length - 1].id + 1;
            entities.push(newEntity);
        }
    }, {
        key: 'updateStoredEntities',
        value: function updateStoredEntities(entitiesToUpdate, entityName) {
            var records = this.storage[entityName].records;
            entitiesToUpdate.forEach(function (modifiedEntity) {
                var index = records.findIndex(function (entity, index, array) {
                    return entity.id === modifiedEntity.id;
                });
                if (index !== -1) {
                    records[index] = modifiedEntity;
                }
            });
        }
    }, {
        key: 'setSessionKey',
        value: function setSessionKey(key) {
            this.sessionKey = key;
        }
    }, {
        key: 'init',
        value: function init(config) {
            this.providerConfig = config;
        }
    }]);

    return FileDataProvider;
}();

exports.default = new FileDataProvider();