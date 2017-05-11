import DataProviderRegistry from '../services/DataProviderRegistry';
import {ListControllerEvents} from './ListController';
import events from 'qnium-events';

class InputFilterController
{
    constructor(params)
    {
        let self = this;
        this.params = params;
        this.targetCtrl = this.params.targetListCtrlName;
        this.lastComplexFltVal = null;

        this.filter = {
            field: this.params.filteringField,
            operation: this.params.complexFilter ? "in" : (this.params.filteringOperation || "like"),
            value: undefined
        }

        this.dataProvider = DataProviderRegistry.get(params.dataProviderName);

        if(this.params.complexFilter)
        {
            events(ListControllerEvents.updateEntities).handle(event => {
                let entitiesToUpdate = event.find(item => item === self.params.complexFilter.relatedEntities);
                if(entitiesToUpdate) {
                    self.applyFilter(this.lastComplexFltVal);
                    console.log("InpFlt", entitiesToUpdate);
                }
            });
        }
    }
    
    applyFilter(filterValue)
    {
        if(this.params.complexFilter)
        {
            this.lastComplexFltVal = filterValue;
            let complexFilter = {
                field: this.params.complexFilter.filteringField,
                operation: this.params.complexFilter.filteringOperation || 'like',
                value: filterValue
            }

            this.dataProvider.executeAction(this.params.complexFilter.entitiesName, this.params.complexFilter.readAction || "read", {filter: [complexFilter]})
            .then(result => {
                this.filter.value = result.data.map(item => item[this.params.complexFilter.key]);
                events(ListControllerEvents.applyFilter).send({targetName: this.targetCtrl, data: this.filter});
            }, err => { this.dataProvider.errorHandler(err.error); });
        } else {
            this.filter.value = filterValue;
            events(ListControllerEvents.applyFilter).send({targetName: this.targetCtrl, data: this.filter});
        }
    }
}

export default InputFilterController;