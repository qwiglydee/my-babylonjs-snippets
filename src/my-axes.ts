import { consume } from "@lit/context";
import { ReactiveElement, type PropertyValues } from "lit";
import { customElement } from "lit/decorators.js";

import { AxesViewer } from "@babylonjs/core/Debug/axesViewer";
import type { Scene } from "@babylonjs/core/scene";

import { sceneCtx } from "./context";
import { debug, debugChanges } from "./utils/debug";

@customElement("my-axes")
export class MyAxesElem extends ReactiveElement {
    @consume({ context: sceneCtx, subscribe: false })
    scene!: Scene;

    override connectedCallback(): void {
        super.connectedCallback();
        this.#init()
    }

    _axes!: AxesViewer;

    #init() {
        debug(this, "initilizing");
        this._axes = new AxesViewer(this.scene);
    }

    override update(changes: PropertyValues) {
        debugChanges(this, "updating", changes);
        super.update(changes);
    }
}
