class DataProviderJSONService
{
    constructor(apiEndpoint, sessionKey) {
        this.sessionKey = sessionKey;
        this.apiEndpoint = apiEndpoint;
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
            if (result.error) {
                throw {message: result.error, ext: result};
            }
            else {
                return result;
            }
        });
    }
}

export default DataProviderJSONService;