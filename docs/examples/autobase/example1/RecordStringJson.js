import {Record} from "./Record.js";
import c from "compact-encoding";

class RecordStringJson extends Record {
    static get type() {
        return "record<string, object>";
    }

    constructor(key, config = {}, autobaseConfig = {}, viewConfig = {}) {
        viewConfig.valueEncoding ||= c.raw.json;
        viewConfig.keyEncoding ||= c.raw.utf8;
        super(key, config, autobaseConfig, viewConfig);
    }
}

export { RecordStringJson };