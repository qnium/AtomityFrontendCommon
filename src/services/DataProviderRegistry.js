class DataProviderRegistry
{
    constructor()
    {
        this.defaultName = "defaultDataProvider";
        this.dataProviders = [];
    }
    
    add(dataProvider, name)
    {
        let key = name || this.defaultName;
        if(this.dataProviders[key] != undefined){
            throw new Error("Data provider with name \"" + key + "\" already exists.");
        }
        this.dataProviders[key] = dataProvider;
    }

    get(name)
    {
        let key = name || this.defaultName;
        return this.dataProviders[key];
    }
}

export default new DataProviderRegistry();