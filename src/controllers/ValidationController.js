import DataProviderRegistry from '../services/DataProviderRegistry';

class ValidationController
{
    constructor(params)
    {
        this.dataProvider = DataProviderRegistry.get(params.dataProviderName);

        this.validators = {};
        this.dataProvider.executeAction(params.entitiesName, "validators").then(result =>
        {
            if(result)
            {
                result.forEach(validator => {
                    let fn;
                    this.validators[validator.fieldName] = {
                        validate: eval( "fn = " + validator.validationCode),
                        fieldValidated: false
                    };
                });
            }
        });
    }

    validateField(validationParams)
    {
        let err = null;
        let validator = this.validators[validationParams.fieldName];
        if(validator) {
            err = validator.validate(validationParams.entityObject[validationParams.fieldName]);
            validator.fieldValidated = true;
        }

        if(!err && validationParams.validateOtherFields) {
            err = this.validateEntity(validationParams.entityObject, validationParams.includeUnchangedFields);
        }
        
        return err;
    }

    validateEntity(entity, includeUnchangedFields)
    {
        let err = null;

        for(let key in this.validators)
        {
            if(includeUnchangedFields || this.validators[key].fieldValidated)
            {            
                err = this.validateField({
                    entityObject: entity,
                    fieldName: key
                });
                if(err) {
                    break;
                }
            }
        }

        return err;
    }
}

export default ValidationController;