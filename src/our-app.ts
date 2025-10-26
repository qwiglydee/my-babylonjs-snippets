import { ReactiveElement, type PropertyValues } from "lit";
import { customElement, property } from "lit/decorators.js";
import { provide } from "@lit/context";

import { type AppCtx, appCtx, draggingCtx, type PickEvent, type ShapeParams } from "./context";
import { debug, debugChanges } from "./utils/debug";
import type { Nullable } from "@babylonjs/core/types";

/**
 * Babylon-unaware web app
 * For orchestrating purposes only
 */
@customElement("our-app")
export class OurAppElem extends ReactiveElement {
    @provide({ context: appCtx })
    ctx!: AppCtx;

    @provide({ context: draggingCtx })
    dragging: Nullable<ShapeParams> = null;


    #updateCtx(props: object) {
        this.ctx = { ...this.ctx, ...props};
    }

    @property()
    foo: string = "Foo";

    constructor() {
        super();
        this.addEventListener('babylon.picked', this.onbabylonpick as EventListener);
    }

    override createRenderRoot() {
        return this;
    }

    override connectedCallback(): void {
        super.connectedCallback();
        debug(this, "initializing");
        this.ctx = {
            status: "Hello",
            foo: "..."
        }
    }

    override update(changes: PropertyValues) {
        debugChanges(this, "updating", changes);
        super.update(changes);
    }

    override updated(changed: PropertyValues): void {
        // NB: broadcasting the ctx may result to new changes somehow
        if (changed.has('foo')) this.#updateCtx({foo: this.foo});
    }

    onbabylonpick = (e: PickEvent) => {
        const { state, mesh } = e.detail;
        if (!state) this.#updateCtx({status: "..."});
        else if (state == 'picked') this.#updateCtx({status: `Picked: ${mesh}`});
    }

    override ondragstart = (event: DragEvent) => {
        this.dragging = JSON.parse(event.dataTransfer!.getData('text/plain'));
        this.#updateCtx({ status: `Dragging ${this.dragging!.label}...`})
    }

    override ondragend = (_event: DragEvent) => {
        this.dragging = null;
        this.#updateCtx({ status: "..." });
    }

} 