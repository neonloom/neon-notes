import z32 from "z32";
import b4a from "b4a";
import {RecordStringJson} from "./RecordStringJson.js";

class RecordBinaryJson extends RecordStringJson {
    static get type() {
        return "record<binary, object>"; // more accurate
    }

    constructor(key, config = {}, autobaseConfig = {}, viewConfig = {}) {
        viewConfig.keyEncoding ||= "binary";
        super(key, config, autobaseConfig, viewConfig);
    }

    async _op(node, db, host) {
        if (!node?.value?.key) return super._op(node, db, host);
        node.value.key = z32.decode(node.value.key)
        return super._op(node, db, host);
    }

    put(key, value, sub) {
        return super.put(z32.encode(key), value, sub);
    }

    async get(key, sub, config) {
        return super.get(key, sub, config);
    }

    async del(key, sub) {
        return super.del(z32.encode(key), sub);
    }
}


export { RecordBinaryJson };