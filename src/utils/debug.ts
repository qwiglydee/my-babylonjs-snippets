import type { PropertyValues } from "lit";

export function debug(that: any, kind: string, data: any = "...") {
    const source = that.tagName ? `${that.tagName}${that.id ? '#' + that.id : ""}` : that.constructor.name; 
    console.debug(source, kind, data);
}

export function debugChanges(that: HTMLElement, kind: string, changes: PropertyValues, keys?: PropertyKey[]) {
    if (!keys) keys = [...changes.keys()];
    // @ts-ignore
    debug(that, kind, { new: Object.fromEntries(keys.map(k => [k, that[k]])), old: Object.fromEntries(changes)});
}