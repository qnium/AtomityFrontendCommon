import moment from 'moment';
import 'moment-timezone';

/**
 * Provides access to backend API.
 */
class DataProviderJSONFile
{
    constructor(folder, sessionKey){
        /**
         * Session key for requests that need authorization.
         */
        this.sessionKey = sessionKey;

        this.errorHandler = function(errorMessage) { throw errorMessage };

        this.storage = {};

        this.jsonFolder = folder;

        this.relatedEntityParameters = null;

        this.actions = {
            'read': this.getEntityData.bind(this),
            'create': this.createEntity.bind(this),
            'update': this.updateEntity.bind(this),
            'delete': this.deleteEntity.bind(this),
            'validators': this.getValidators.bind(this),
            'readRelatedEntities': this.getRelatedEntityData.bind(this),
            'createReadRequest': this.createReadRequest.bind(this),
            'fakeAction': this.fakeAction.bind(this)
        };
    }

    executeAction(entityName, action, data) {
        return this.actions[action](entityName, data);
    }

    createReadRequest(entityName, data) {
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

     fakeAction(){
         return this.getPromiseWithScopeDigest();
     }

    getEntityData(entityName, data) {
        var req = this.createReadRequest(entityName, data);
        var loaded = this.storage[entityName] ? this.getPromiseWithScopeDigest() : this.loadEntitiesFromJson(entityName);
        return loaded.then(() => 
            this.fillRelatedEntities(entityName).then(() => 
                this.getPreparedEntityDataForReadAction(req, entityName)
            )
        )
    }

    getRelatedEntityData(entityName, data) {
        var req = this.createReadRequest(entityName, data);
        var loaded = this.storage[entityName] ? this.getPromiseWithScopeDigest() : this.loadEntitiesFromJson(entityName);
        return loaded.then(() => this.getPreparedEntityDataForRelatedReadAction(req, entityName));
    }

    getValidators(entityName) {
        return this.getPromiseWithScopeDigest().then(() =>
            {
                let resultValidators = null;
                let storageValidators = this.storage[entityName].validators;

                if(this.storage[entityName] && storageValidators)
                {
                    resultValidators = [];

                    for (let key in storageValidators)
                    {
                        let fieldValidator = { fieldName: key};
                        let validatorFn = "function (object) { var err = null;";
                        
                        storageValidators[key].forEach((item) => {
                            validatorFn += item;
                            validatorFn += "if (err != null) return err;";
                        });

                        validatorFn += "return null; }";
                        fieldValidator.validationCode = validatorFn;
                        resultValidators.push(fieldValidator);
                    }
                }
                return {result: resultValidators};
            }
        );
    }

    createEntity(entityName, record) {
        record = record.entity ? record.entity : record;
        this.addToStoredEntities(record, entityName);
        return this.fillRelatedEntities(entityName)
            .then(() => this.getEmptyDataWithTotalCount(entityName));
    }

    updateEntity(entityName, records) {
        records = records.entities ? records.entities : records;
        this.updateStoredEntities(records, entityName);
        return this.fillRelatedEntities(entityName)
            .then(() => this.getEmptyDataWithTotalCount(entityName));
    }

    deleteEntity(entityName, records) {
        records = records.entities ? records.entities : records;
        this.deleteFromStoredEntities(records, entityName);
        return this.getPromiseWithScopeDigest(() => this.getEmptyDataWithTotalCount(entityName));
    }
    /**
     * Action functions.
     * End
     */

    loadEntitiesFromJson(entityName) {
        let self = this;
        return fetch(this.jsonFolder + '/' + entityName + '.json')
        .then(response => {
             return response.json()
        })
        .then(response => {
                self.storage[entityName] = response;
                return self.fillRelatedEntities(entityName);
            });
    }

    fillRelatedEntities(entityName) {
        var promices = [];
        var relationships = this.storage[entityName].relationships;
        if(relationships) {
            relationships.forEach((relationship, i, arr) => {
                promices.push(this.getEntityData(relationship.relatedEntity, {})
                    .then(result => {
                        let relatedEntities = result.data;
                        return this.storage[entityName].records.forEach((entity, i, arr) => {
                            {
                                let foundRelatedEntity = relatedEntities.find((relatedEntity, index, array) =>
                                    entity[relationship.field][relationship.relatedEntityField] == relatedEntity[relationship.relatedEntityField]);
                                if(foundRelatedEntity) {
                                    entity[relationship.relatedEntity] = foundRelatedEntity;
                                    entity[relationship.filtering_field_name] = foundRelatedEntity[relationship.relatedEntityField];
                                } else {
                                    entity[relationship.relatedEntity] = {};
                                }
                            }
                        });
                    }));
            });
        }
        return Promise.all(promices);
    }

    getPromiseWithScopeDigest(resolve) {
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve();
            }, 500);
        });
    }    

    getPreparedEntityDataForReadAction(req, entityName) {
        var data = this.getRequestedEntities(req, entityName);
        return data;
    }

    getPreparedEntityDataForRelatedReadAction(req, entityName) {
        var data = this.getEmptyDataWithTotalCount(entityName);
        data.data = this.getFilteredEntitiesFrom(this.storage[entityName].records, [req.data])
            .map(entity => entity.id);
        return data;
    }

    getEmptyDataWithTotalCount(entityName) {
        var data = {};
        data.totalCounter = this.storage[entityName].records.length;
        return data;
    }

    getRequestedEntities(req, entityName) {
        var newEntities = this.storage[entityName].records;
        if (req.data.filter) {
            newEntities = this.getFilteredEntitiesFrom(newEntities, req.data.filter);
        }
        var data = {totalCounter: newEntities.length};
        newEntities = this.getPagedEntitiesFrom(newEntities, req.data.startIndex, req.data.startIndex + req.data.count);
        data.data = newEntities;
        return data;
    }

    getFilteredEntitiesFrom(oldEntities, filters) {
        var newEntities = Object.create(oldEntities);

        filters.forEach((filter, i, arr) => {

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

                newEntities.sort((a, b) => {
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
                likeValue.forEach((v, i, arr) => {
                    v = v.trim();
                    if (v) {
                        filteredEntities = filteredEntities
                            .concat(newEntities.filter(entity => entity[field].search(v) !== -1
                            ));
                    }
                });
                newEntities = filteredEntities;

            } else if (operation === 'in' && value) {
                newEntities = newEntities.filter(entity =>
                    value.find((relatedEntityValue, index, array) =>
                        entity[field] == relatedEntityValue
                    ) !== undefined
                );

            } else if (operation === 'eq' && value) {
                newEntities = newEntities.filter(entity => entity[field] == value);
            } else if (operation === 'date_ge' && value) {
                try {
                    var unixTime = value.format("x");
                    newEntities = newEntities.filter(entity => {
                        return entity[field] >= unixTime;
                    });
                } catch (ex) { }
            } else if (operation === 'date_le' && value) {
                try {
                    var unixTime = value.format("x");
                    newEntities = newEntities.filter(entity => {
                        return entity[field] <= unixTime;
                    });
                } catch (ex) { }
            }
        });
        return newEntities;
    }

    getPagedEntitiesFrom(oldEntities, fromIndex, toIndex) {
        if (fromIndex < toIndex) {
            return oldEntities.slice(fromIndex, toIndex);
        } else {
            return oldEntities;
        }

    }

    deleteFromStoredEntities(entitiesToDelete, entityName) {
        this.storage[entityName].records = this.storage[entityName].records.filter(e =>
            entitiesToDelete.find((entityToBeDeleted, index, array) => e.id === entityToBeDeleted.id) === undefined);
    }

    addToStoredEntities(record, entityName) {
        var newEntity = Object.assign({}, record);
        var entities = this.storage[entityName].records;
        newEntity.id = entities[entities.length - 1].id + 1;
        entities.push(newEntity);
    }

    updateStoredEntities(entitiesToUpdate, entityName) {
        var records = this.storage[entityName].records;
        entitiesToUpdate.forEach(modifiedEntity => {
            var index = records.findIndex((entity, index, array) => entity.id === modifiedEntity.id);
            if (index !== -1) {
                records[index] = modifiedEntity;
            }
        });
    }

    setSessionKey(key) {
        this.sessionKey = key;
    }
}

export default DataProviderJSONFile;