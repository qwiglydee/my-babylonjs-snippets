import { ReactiveElement, type PropertyValues } from "lit";
import { customElement, property } from "lit/decorators.js";
import { provide } from "@lit/context";

import { type AppCtx, appCtx, type PickEvent } from "./context";
import { debug, debugChanges } from "./utils/debug";

/**
 * Babylon-unaware web app
 * For orchestrating purposes only
 */
@customElement("our-app")
export class OurAppElem extends ReactiveElement {
    @provide({ context: appCtx })
    ctx!: AppCtx;

    #updateCtx(props: object) {
        this.ctx = { ...this.ctx, ...props};
    }

    @property()
    foo: string = "Foo";

    constructor() {
        super();
        // add event listeners...
        this.addEventListener('babylon.picked', this.onbabylonpick as EventListener);
    }

    override createRenderRoot() {
        return this;
    }

    override connectedCallback(): void {
        super.connectedCallback();
        debug(this, "connected");
        this.ctx = {
            status: "Hello",
            foo: "..."
        }
    }

    override update(changes: PropertyValues) {
        if (!this.hasUpdated) debug(this, "created");
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
        else if (state == 'dragging') this.#updateCtx({status: `Dragging: ${mesh}`});
    }
} 