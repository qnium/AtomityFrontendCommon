import dataProvider from '../services/FileDataProvider'
import {ListControllerEvents} from './ListController';
import {ListController} from './ListController';

var events = require('qnium-events');

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

        this.listCtrl = new ListController({
            ctrlName: this.params.listCtrlName,
            entitiesName: this.params.entitiesName,
            readAction: this.readAction,
            pageDataLength: 0
        });
    }
    
    applyFilter(filterValue)
    {
        this.filter.value = filterValue;
        events(ListControllerEvents.applyFilter).send({targetName: this.targetCtrl, data: this.filter});
    }
}

export default SelectFilterController;