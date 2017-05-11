class DataProviderJSONService
{
    constructor(params) {
        this.sessionKey = params.sessionKey;
        this.apiEndpoint = params.apiEndpoint;
        this.errorHandler = params.errorHandler || function(errorMessage) { throw errorMessage };
    }

    executeAction(entity, action, payload) {
        let req = {
            entityName: entity,
            action: action,
            data: payload,
            sessionKey: this.sessionKey
        };
        return fetch(this.apiEndpoint, {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(req)
        })
        .then(response => response.json())
        .then(result => {
            if (result.error || result.errorCode) {
                throw result;
            }
            else {
                return result;
            }
        }).catch(err => {
            if(err.name === "TypeError" && err.message === "Failed to fetch"){
                return Promise.reject({error: "Server inaccessible"});
            } else {
                throw err;
            }
        });
    }
    
    init(config) {
        this.apiEndpoint = config.apiEndpoint;
    }

    setSessionKey(key) {
        this.sessionKey = key;
    }
}

export default DataProviderJSONService;