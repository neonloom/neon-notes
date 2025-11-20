import {BaseBase} from "./BaseBase.js";
import c from "compact-encoding";
import {feedBaseEncoding} from "./messages/feedBaseEncoding.js";
import {coreCreateScanStream} from "../util/coreCreateScanStream.js";
import b4a from "b4a";

class Feed extends BaseBase {
    static get type() {
        return "feed<binary>";
    }

    get view() {
        return this.base.view;
    }

    constructor(key, config = {}, autobaseConfig = {}, viewConfig = {}) {
        autobaseConfig.valueEncoding = feedBaseEncoding(autobaseConfig?.valueEncoding || c.binary);
        super(key, config, autobaseConfig, viewConfig);
    }

    createScanStream(config = {}) {
        return coreCreateScanStream(this.view, config);
    }

    async first(predicate) {
        for await (const entry of this.createScanStream({reverse: false, predicate}))
            return entry;
        return null;
    }

    async last(predicate) {
        for await (const entry of this.createScanStream({reverse: true, predicate}))
            return entry;
        return null;
    }

    async amend (config = {}) {
        const {
            constant,
            predicate = () => true,         // default: first entry
            map       = e => constant ?? e,             // default: identity
            reverse   = true
        } = config;

        await this.update();            // refresh view length/index

        for await (const entry of this.createScanStream({ reverse, predicate })) {
            const updated = await map(entry);
            if (updated) await this.append(updated);
            return updated;               // <-- early-return replaces break
        }

        return null;                    // no entry matched
    }

    append(value) {
        return this.base.append({
            op: "append",
            value
        });
    }

    async _op(node, feed, host) {
        const { op, value } = node.value;
        return op === "append" ? feed.append(value) : super._op(node, feed, host);
    }
}

export {Feed}