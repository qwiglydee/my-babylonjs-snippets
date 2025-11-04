import { provide } from "@lit/context";
import { ReactiveElement, type PropertyValues } from "lit";
import { customElement, property } from "lit/decorators.js";

import { debug, debugChanges } from "@utils/debug";
import { assertNonNull } from "@utils/asserts";

import { type IAppElement, type IBabylonElement, appCtx, babylonCtx, type AppCtx, type PickEvent } from "./context";

/**
 * Babylon-unaware web app
 * For orchestrating purposes only
 */
@customElement("our-app")
export class OurAppElem extends ReactiveElement implements IAppElement{
    @provide({ context: babylonCtx })
    babylon!: IBabylonElement;

    @provide({ context: appCtx })
    ctx!: AppCtx;

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
        // @ts-ignore
        this.babylon = this.querySelector('my-babylon') as IBabylonElement;
        
        assertNonNull(this.babylon, "missing my babylon");
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
        else if (state == 'picked') {
            if(mesh) this.#updateCtx({status: `Picked: ${mesh}`});
            else this.#updateCtx({status: "..."});
        }
    }
} 