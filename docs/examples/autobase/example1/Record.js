import Hyperbee from "hyperbee";
import {BaseBase} from "./BaseBase.js";

class Record extends BaseBase {
    static get type() {
        return "record<any, any>";
    }

    get view() {
        return this.base.view;
    }

    constructor(key, config = {}, autobaseConfig = {}, viewConfig = {}) {
        console.log(`[Record] Initializing Record instance with key: ${key}`);
        viewConfig.extension = false;
        super(key, config, autobaseConfig, viewConfig);
    }

    del(key, sub) {
        console.log(`[Record] Deleting key="${key}" from sub="${sub}"`);
        return this.base.append({
            op: "del",
            key,
            sub
        });
    }

    put(key, value, sub) {
        console.log(`[Record] Putting key="${key}" with value=`, value, `to sub="${sub}"`);
        return this.base.append({
            op: "put",
            value,
            key,
            sub
        });
    }

    _openView(store) {
        console.log(`[Record] Opening Hyperbee view: ${this.viewName}`);
        return new Hyperbee(store.get({name: this.viewName}), this.viewConfig);
    }

    async _op(node, db, host) {
        const {op, key, value, sub} = node.value;
        const _db = sub ? db.sub(sub) : db;
        console.log(`[Record] Applying operation: ${op} for key="${key}"`);
        switch (op) {
            case "put": {
                await _db.put(key, value);
                break;
            }
            case "del": {
                await _db.del(key);
                break;
            }
            default: {
                await super._op(node, _db, host);
                break;
            }
        }
    }

    async get(key, sub = undefined, config = {}) {
        console.log(`[Record] Getting key="${key}" from sub="${sub}"`);
        const db = sub ? this.base.view.sub(sub) : this.base.view;
        return db.get(key, config);
    }
}

export {Record};
