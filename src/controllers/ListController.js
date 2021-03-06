import DataProviderRegistry from '../services/DataProviderRegistry';
import events from 'qnium-events';

let ctrlNameCounter = 0;
let defaultCtrlName = "defaultCtrlName";

let ListControllerEvents =
{
    // events handled by controller
    refresh: events().create({targetName: String}),
    deleteRecords: events().create({targetName: String, data: {}}),
    selectPage: events().create({targetName: String, data: Number}),
    applyFilter: events().create({targetName: String, data: {}}),
    sort: events().create({targetName: String, data: {}}),
    setRowChecked: events().create({targetName: String, data: {}}),
    setAllChecked: events().create({targetName: String, data: {}}),
    customAction: events().create({targetName: String, data: {}}),
    updateEntities: events().create({entitiesName: Array}),

    // events emitted by controller
    stateChanged: events().create({sourceName: String, data: {}})
}

class ListController
{
    constructor(params)
    {
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
        this.ctrlName = params.ctrlName || (defaultCtrlName + ctrlNameCounter++);
        this.readAction = params.readAction || "read";
        this.deleteAction = params.deleteAction || "delete";
        this.pageDataLength = params.pageDataLength == 0 ? 0 : (params.pageDataLength || 10);
        this.useDummyRows = params.useDummyRows;
        this.entityKeyField = params.entityKeyField || "id";
        this.dataProvider = DataProviderRegistry.get(params.dataProviderName);
        if(params.initFilters){
            params.initFilters.forEach(filter => {
                this.setFilter(filter);
            });
        }
        
        this.refreshHandlerRemover = events(ListControllerEvents.refresh).handle(event => { this.doAction(this.refresh, event); });
        this.deleteRecordsHandlerRemover = events(ListControllerEvents.deleteRecords).handle(event => { this.doAction(this.deleteRecord, event); });
        this.selectPageHandlerRemover = events(ListControllerEvents.selectPage).handle(event => { this.doAction(this.selectPage, event); });
        this.applyFilterHandlerRemover = events(ListControllerEvents.applyFilter).handle(event => { this.doAction(this.applyFilter, event); });
        this.sortHandlerRemover = events(ListControllerEvents.sort).handle(event => { this.doAction(this.sortAction, event); });
        this.setRowCheckedHandlerRemover = events(ListControllerEvents.setRowChecked).handle(event => { this.doAction(this.setRowCheckedAction, event); });
        this.setAllCheckedHandlerRemover = events(ListControllerEvents.setAllChecked).handle(event => { this.doAction(this.setAllCheckedAction, event); });
        this.customActionHandlerRemover = events(ListControllerEvents.customAction).handle(event => { this.doAction(this.customAction, event); });
        this.updateEntitiesHandlerRemover = events(ListControllerEvents.updateEntities).handle(event => this.updateEntities(event));

        this.refresh();
    }

    destroy(){
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
        }, err => { this.dataProvider.errorHandler(err.error, err); });
    }
    
    customAction(params)
    {
        this.setProgressState(true);
        this.dataProvider.executeAction(this.entitiesName, params.action, params.data).then(result => {
            this.setProgressState(false);
            this.refresh();
        }, err => { this.dataProvider.errorHandler(err.error, err); });        
    }
    
    setFilter(filter)
    {
        const filterName = this.getFilterName(filter);
        this.filters[filterName] = filter;
    }
    
    applyFilter(filter)
    {
        this.setFilter(filter);
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
        }, err => { this.dataProvider.errorHandler(err.error, err); });
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
