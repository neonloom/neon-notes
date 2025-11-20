import {Feed} from "./Feed.js";
import c from "compact-encoding";

class FeedJson extends Feed {
    static get type() {
        return "feed<json>";
    }

    constructor(key, config = {}, autobaseConfig = {}, viewConfig = {}) {
        autobaseConfig.valueEncoding = c.json;
        viewConfig.valueEncoding = c.json;
        super(key, config, autobaseConfig, viewConfig);
    }
}

export { FeedJson };