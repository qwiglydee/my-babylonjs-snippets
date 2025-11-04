import { consume } from "@lit/context";
import { ReactiveElement, type PropertyValues } from "lit";
import { customElement, property } from "lit/decorators.js";

import { AxesViewer } from "@babylonjs/core/Debug/axesViewer";
import type { Scene } from "@babylonjs/core/scene";
import { debug, debugChanges } from "@utils/debug";
import { WithoutShadow } from "@utils/noshadow";

import { sceneCtx } from "./context";

@customElement("my-axes")
export class MyAxesElem extends WithoutShadow(ReactiveElement) {
    @consume({ context: sceneCtx, subscribe: false })
    scene!: Scene;

    @property({ type: Number })
    scale = 1;

    @property({ type: Number })
    thickness = 1;

    override connectedCallback(): void {
        super.connectedCallback();
        this.#init()
    }

    _axes!: AxesViewer;

    #init() {
        debug(this, "initilizing");
        this._axes = new AxesViewer(this.scene, this.scale, undefined, undefined, undefined, undefined, this.thickness);
    }

    override update(changes: PropertyValues) {
        debugChanges(this, "updating", changes);
        super.update(changes);
    }
}
