import c from "compact-encoding";

export const feedBaseEncoding = (valueEncoding) => {
    return {
        preencode(state, {op, value}) {
            c.utf8.preencode(state, op);
            valueEncoding.preencode(state, value);
        },
        encode(state, {op, value}) {
            c.utf8.encode(state, op);
            valueEncoding.encode(state, value);
        },
        decode(state) {
            const op = c.utf8.decode(state);
            const value = valueEncoding.decode(state);
            return {op, value}
        }
    }
}