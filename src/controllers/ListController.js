import DataProviderRegistry from '../services/DataProviderRegistry';
import events from 'qnium-events';

let ctrlNameCounter = 0;
let defaultCtrlName = "defaultCtrlName";

let ListControllerEvents =
{
    // events handled by controller
    refresh: events().create({targetName: String}),
    deleteRecords: events().create({targetName: String, data: Object}),
    selectPage: events().create({targetName: String, data: Object}),
    applyFilter: events().create({targetName: String, data: Object}),
    sort: events().create({targetName: String, data: Object}),
    setRowChecked: events().create({targetName: String, data: Object}),
    setAllChecked: events().create({targetName: String, data: Object}),
    customAction: events().create({targetName: String, data: Object}),
    updateEntities: events().create({entitiesName: Array}),

    // events emitted by controller
    stateChanged: events().create({sourceName: String, data: Object})
}

class ListController
{
    constructor(params)
    {
        // params
        this.entitiesName = params.entitiesName;
        this.ctrlName = params.ctrlName || (defaultCtrlName + ctrlNameCounter++);
        this.readAction = params.readAction || "read";
        this.deleteAction = params.deleteAction || "delete";
        this.pageDataLength = params.pageDataLength == 0 ? 0 : (params.pageDataLength || 10);
        this.useDummyRows = params.useDummyRows;
        this.entityKeyField = params.entityKeyField || "id";
        this.dataProvider = DataProviderRegistry.get(params.dataProviderName);
        
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
        
        events(ListControllerEvents.refresh).handle(event => { this.doAction(this.refresh, event); });
        events(ListControllerEvents.deleteRecords).handle(event => { this.doAction(this.deleteRecord, event); });
        events(ListControllerEvents.selectPage).handle(event => { this.doAction(this.selectPage, event); });
        events(ListControllerEvents.applyFilter).handle(event => { this.doAction(this.applyFilter, event); });
        events(ListControllerEvents.sort).handle(event => { this.doAction(this.sortAction, event); });
        events(ListControllerEvents.setRowChecked).handle(event => { this.doAction(this.setRowCheckedAction, event); });
        events(ListControllerEvents.setAllChecked).handle(event => { this.doAction(this.setAllCheckedAction, event); });
        events(ListControllerEvents.customAction).handle(event => { this.doAction(this.customAction, event); });
        events(ListControllerEvents.updateEntities).handle(event => this.updateEntities(event));

        this.refresh();
    }

    getFilterName(filter) {
        return filter.field + "-" + filter.operation;
    }
        
    updateEntities(entities) {
        if(entities && entities.filter(item => item === this.entitiesName).length > 0) {
            this.refresh();
        }
    }

    doAction(actionPerformer, params) {
        if(this.ctrlName === params.targetName) {
            actionPerformer.bind(this)(params.data);
        }
    }
    
    deleteRecord(records)
    {
        this.setProgressState(true);
        this.dataProvider.executeAction(this.entitiesName, this.deleteAction, records).then(result => {
            this.setProgressState(false);
            this.refresh();
        }, err => { this.dataProvider.errorHandler(err.error); });        
    }
    
    customAction(params)
    {
        this.setProgressState(true);
        this.dataProvider.executeAction(this.entitiesName, params.action, params.payload).then(result => {
            this.setProgressState(false);
            this.refresh();
        }, err => { this.dataProvider.errorHandler(err.error); });        
    }
    
    applyFilter(filter)
    {
        let filterName = this.getFilterName(filter);
        this.filters[filterName] = filter;
        this.refresh();
    }

    // window.QEventEmitter.removeListener(this.refreshActionListener);

    sortAction(sortParams)
    {
        let newSortingFilter = {
            field: sortParams.sortingField,
            operation: "sort"
        }

        let newFilterName = this.getFilterName(newSortingFilter);
        let currentSortingFilter = this.filters[newFilterName];
        
        if(currentSortingFilter) {
            if(sortParams.value !== undefined){
                newSortingFilter.value = sortParams.value;
            } else {
                newSortingFilter.value = !currentSortingFilter.value;
            }
        } else {
            let newFilters = {};
            for(let key in this.filters) {
                if(!key.endsWith("-sort")){
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

    setRowCheckedAction(params)
    {
        let item = this.pageData[params.rowIndex];
        item.checked = params.newState === undefined ? !item.checked : params.newState;
        this.sendStateChangedEvent();
    }

    setAllCheckedAction(params)
    {
        let newState = params && params.newState !== undefined ? params.newState : true;
        this.pageData.filter(item => !item.dummy).map(item => item.checked = newState);
        this.sendStateChangedEvent();
    }

    setProgressState(newState) {
        if(this.actionInProgress !== newState){
            this.actionInProgress = newState;
            this.sendStateChangedEvent();
        }
    }

    sendStateChangedEvent(){
        events(ListControllerEvents.stateChanged).send({sourceName: this.ctrlName, data: this});
    }

    updatePaginationInfo() {
        this.totalPages = this.pageDataLength == 0 ? 1 : Math.ceil(this.totalRecords / this.pageDataLength);
        this.totalPages = Math.max(1, this.totalPages);
        this.nextPageAvailable = this.currentPage < this.totalPages;
        this.prevPageAvailable = this.currentPage > 1;
    }

    selectPage(pageNumber){
        this.currentPage = pageNumber;
        this.refresh();
    }
    
    arrayDataToPageData(arrayData)
    {
        let newPageData = arrayData.map((item, index) => {
            return {
                index: index,
                checked: false,
                data: item
            }
        });
        
        let self = this;
        newPageData.forEach(newItem =>
        {
            let sameItems = self.pageData.filter(currentItem => {
                return !currentItem.dummy && currentItem.data[self.entityKeyField] === newItem.data[self.entityKeyField];
            });
            if(sameItems[0] !== undefined) {
                newItem.checked = sameItems[0].checked;
            }
        });

        return newPageData;
    }
    
    addDummyRows() {
        for(let i = this.pageData.length; i < this.pageDataLength; i++){
            this.pageData.push({dummy: true});
        }
    }

    refresh() {
        this.setProgressState(true);
        
        let params = {
            filter: this.objectToArray(this.filters),
            startIndex: (this.currentPage - 1) * this.pageDataLength,
            count: this.pageDataLength
        }
        
        this.dataProvider.executeAction(this.entitiesName, this.readAction, params)
        .then(result =>
        {
            this.setProgressState(false);
            this.pageData = this.arrayDataToPageData(result.data);
            this.totalRecords = result.totalCounter;
            this.updatePaginationInfo();
            
            if(this.currentPage > 1 && this.pageData.length === 0){
                this.currentPage = this.totalPages;
                this.refresh();
            } else {
                if(this.useDummyRows === true){
                    this.addDummyRows();
                }
                this.sendStateChangedEvent();
            }
        }, err => { this.dataProvider.errorHandler(err.error); });                
    }

    objectToArray(obj) {
        var result = [];
        for (var key in obj) {
            result.push(obj[key]);
        }
        return result;
    }    
}

export { ListController, ListControllerEvents };
