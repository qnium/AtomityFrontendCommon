import DataProviderRegistry from '../services/DataProviderRegistry';
import {ListControllerEvents} from './ListController';
import {ListController} from './ListController';
import events from 'qnium-events';

class SelectFilterController
{
    constructor(params)
    {
        let self = this;
        this.params = params;

        this.targetCtrl = this.params.targetListCtrlName;
        this.readAction = this.params.readAction || "read";

        this.filter = {
            field: this.params.filteringField,
            operation: 'eq',
            value: undefined
        }

        if(this.params.entitiesName) {
            this.listCtrl = new ListController({
                ctrlName: this.params.listCtrlName,
                entitiesName: this.params.entitiesName,
                readAction: this.readAction,
                pageDataLength: 0,
                dataProviderName: this.params.dataProviderName
            });
        }
    }
    
    applyFilter(filterValue)
    {
        this.filter.value = filterValue;
        events(ListControllerEvents.applyFilter).send({targetName: this.targetCtrl, data: this.filter});
    }
}

export default SelectFilterController;