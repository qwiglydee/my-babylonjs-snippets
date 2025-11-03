import { consume } from "@lit/context";
import { ReactiveElement, type PropertyValues } from "lit";
import { customElement, state } from "lit/decorators.js";

import type { Scene } from "@babylonjs/core/scene";
import { debug, debugChanges } from "@utils/debug";

import { modelCtx, sceneCtx, type ModelCtx } from "./context";

@customElement("my-something")
export class MySomethingElem extends ReactiveElement {
    @consume({ context: sceneCtx, subscribe: false })
    scene!: Scene;

    @consume({ context: modelCtx, subscribe: true })
    @state()
    model!: ModelCtx;

    override connectedCallback(): void {
        super.connectedCallback();
        this.#init()
    }

    #init() {
        debug(this, "initilizing");
    }

    override update(changes: PropertyValues) {
        debugChanges(this, "updating", changes);
        super.update(changes);
    }
}
