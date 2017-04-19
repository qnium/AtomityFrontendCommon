import dataProvider from '../services/FileDataProvider'
import {ListControllerEvents} from './ListController';

var events = require('qnium-events');

class SelectFilterController
{
    constructor(params)
    {
        this.params = params;

        this.targetCtrl = this.params.targetListCtrlName;
        this.readAction = this.params.readAction || "read";

        this.filter = {
            field: this.params.filteringField,
            operation: 'eq',
            value: undefined
        }
    }
    
    applyFilter(filterValue)
    {
        this.filter.value = filterValue;
        events(ListControllerEvents.applyFilter).send({targetName: this.targetCtrl, data: this.filter});
    }

    loadOptions()
    {
        if(this.params.entitiesName)
        {
            return dataProvider.executeAction(this.params.entitiesName, this.readAction, {})
            .then(result => {
                return result.data;
            });
        } else {
            return new Promise(() => {
                return [];
            });
        }
    }
}

export default SelectFilterController;