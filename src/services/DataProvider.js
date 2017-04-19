class DataProvider
{
    constructor() {
        this.sessionKey = null;
        this.apiEndpoint = null;
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
                throw new Error(result.error);
            }
            else {
                return result;
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

export default new DataProvider();