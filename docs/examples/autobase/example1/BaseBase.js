import Autobase from "autobase";
import { openCorestore } from "../store/index.js";
import z32 from "z32";
import b4a from "b4a";
import c from "compact-encoding";
import ReadyResource from "ready-resource";

class BaseBase extends ReadyResource {
    static get type() {
        return "abstract";
    }

    get key() {
        return this.base.key
    }

    get id() {
        return b4a.isBuffer(this.base.key) ? z32.encode(this.base.key) : null;
    }

    get local() {
        return this.base.local;
    }

    get view() {
        return this.base.view;
    }

    get writable() {
        return this.base.writable;
    }

    get store() {
        return this.base.store;
    }

    static create(config = {}) {
        if (typeof config === "string") config = { name: config };
        const { name = "default", type = this.type } = config;
        if (type === "abstract") {
            console.error("[BaseBase] Attempted to create abstract type.");
            throw new Error("Cannot create abstract type.");
        }
        console.log(`[BaseBase] Creating Autobase local key for type: ${type}, name: ${name}`);
        return Autobase.getLocalKey(openCorestore(`__${type}__${name}__`));
    }

    constructor(key, config = {}, autobaseConfig = {}, viewConfig = {}) {
        super();
        const { name, type, ...meta } = typeof config === "string"
            ? { name: config, type: this.constructor.type }
            : { name: config?.name ?? "default", type: config?.type ?? this.constructor.type };

        const store = openCorestore(`__${type}__${name}__`);
        const { viewName = `${name}-view` } = viewConfig;

        console.log(`[BaseBase] Initializing ${type} instance with view name: ${viewName}`);

        this.viewConfig = viewConfig;
        this.viewName = viewName;
        this.meta = meta;
        this.type = type;
        autobaseConfig.apply = this._apply.bind(this);
        autobaseConfig.open = this._openView.bind(this);
        autobaseConfig.valueEncoding ??= c.json;
        this.autobaseConfig = autobaseConfig;

        this.base = new Autobase(store, key, autobaseConfig);
    }

    async _open() {
        await this.base.ready();
    }

    async _close() {
        await this.base.close();
    }

    async _init() {}

    update(args) {
        console.log(`[BaseBase] Updating with args:`, args);
        return this.base.update(args);
    }

    get(index, config = {}) {
        return this.base.view.get(index, config);
    }

    async addWriter(key, opts = {}) {
        if (b4a.isBuffer(key)) key = z32.encode(key);
        return this._addWriter(key, opts);
    }

    async _addWriter(key, opts) {
        return this.base.append({
            key,
            op: `add${opts?.indexer ? "-indexer" : ""}`
        });
    }

    async removeWriter(key) {
        if (b4a.isBuffer(key)) key = z32.encode(key);
        return this._removeWriter(key);
    }

    async _removeWriter(key) {
        return this.base.append({
            key: key,
            op: `remove`
        })
    }

    async _apply(updates, view, host) {
        for await (const node of updates) {
            await this._op(node, view, host);
        }
    }

    _openView(store) {
        return store.get({name: this.viewName, ...this.viewConfig});
    }

    async _op(node, _, host) {
        const { op, key } = node.value;
        switch (op) {
            case "add": {
                await host.addWriter(z32.decode(key));
                break;
            }
            case "add-indexer": {
                await host.addWriter(z32.decode(key), { indexer: true })
                break;
            }
            case "remove": {
                await host.removeWriter(z32.decode(key));
                break;
            }
        }
    }
}

export { BaseBase };
