export function bubbleEvent<T>(that: HTMLElement, type: string, detail?: T): void {
    that.dispatchEvent(new CustomEvent<T>(type, { detail, bubbles: true, composed: true }));
}

export function queueEvent<T>(that: HTMLElement, type: string, detail?: T): any {
    queueMicrotask(() => bubbleEvent<T>(that, type, detail));
}

export function origTarget(event: Event | CustomEvent): HTMLElement {
    return event.composedPath()[0] as HTMLElement;
}
