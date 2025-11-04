import { consume, provide } from "@lit/context";
import { ReactiveElement } from "lit";
import { customElement, property } from "lit/decorators.js";

import { UtilityLayerRenderer } from "@babylonjs/core/Rendering/utilityLayerRenderer";
import type { Scene } from "@babylonjs/core/scene";

import { WithoutShadow } from "@utils/noshadow";

import { sceneCtx } from "./context";

@customElement("my-layer")
export class MyLayerElem extends WithoutShadow(ReactiveElement) {
    @consume({ context: sceneCtx, subscribe: false })
    original!: Scene;

    @property({ type: Boolean})
    events = false;

    layer!: UtilityLayerRenderer;

    @provide({ context: sceneCtx })
    utility!: Scene;

    override connectedCallback(): void {
        super.connectedCallback();
        this.#init();
    }

    #init() {
        this.layer = new UtilityLayerRenderer(this.original, this.events, false);
        this.utility = this.layer.utilityLayerScene;
    }
}
