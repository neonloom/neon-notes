let apiKey;
export function setApiKey(_apiKey) {
    apiKey = _apiKey;
}

class ApiBased {
    #apiKey;
    baseURL;

    constructor(config = {}) {
        const {
            apiKey,
            baseURL
        } = config;
        this.#apiKey = apiKey;
        this.baseURL = baseURL;
    }

    _warmup() { }
    _chat() { }
    _generate() { }

    _compileOptions(method, endPoint, options = {}) {
        const baseURL = this.baseURL;
        if (method === "POST") {
            return new Request(`${baseURL}/${endPoint}`, {
                method: "POST",
                authorization: apiKey ? `Bearer ${apiKey}` : null,
                contentType: "application/json",
                body: JSON.stringify(options)
            })
        } else if (method === "GET") {
            return new Request(`${baseURL}/${endPoint}`);
        } else {
            throw new Error("Unsupported method");
        }
    }
}

export { ApiBased };