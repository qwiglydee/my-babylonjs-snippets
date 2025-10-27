import { consume } from "@lit/context";
import { ReactiveElement, type PropertyValues } from "lit";
import { customElement, state, property } from "lit/decorators.js";

import type { Scene } from "@babylonjs/core/scene";
import { AdvancedDynamicTexture } from "@babylonjs/gui/2D/advancedDynamicTexture";
import { type Nullable } from "@babylonjs/core/types";
import type { TransformNode } from "@babylonjs/core/Meshes/transformNode";

import { Spot } from "./gui2d/spot";
import { sceneCtx, type ModelCtx, modelCtx, guiCtx } from "./context";
import { debug, debugChanges } from "./utils/debug";

@customElement("my-gui-hotspot")
export class MyGUIHotspotElem extends ReactiveElement {
    @consume({ context: sceneCtx, subscribe: false })
    scene!: Scene;

    @consume({ context: guiCtx, subscribe: false })
    gui!: AdvancedDynamicTexture;

    @consume({ context: modelCtx, subscribe: true })
    @state()
    model!: ModelCtx;

    @property()
    anchor: Nullable<string> = null;

    @state()
    _anchor: Nullable<TransformNode> = null;

    // set to disabled when anchor node not available
    @property({ type: Boolean, reflect: true })
    disabled = false;

    @property()
    color: string = "#f0f020";

    @property({ type: Number })
    alpha = 0.5;

    @property({ type: Number })
    size: number = 8;

    @property({ type: Boolean })
    blinking = false;

    override connectedCallback(): void {
        super.connectedCallback();
        this.#init();
    }

    _spot!: Spot;

    #init() {
        debug(this, "initilizing");
        const spot = new Spot(this.id);
        this.gui.addControl(this._spot);
        spot.color = this.color;
        spot.diameter = this.size;
        spot.isVisible = false;
        spot.blinking = this.blinking;
        
        this._spot = spot;
        this.gui.addControl(this._spot);
    }

    #attach() {
        this._spot.linkWithMesh(this._anchor);
        this._spot.isVisible = (this._anchor !== null);
    }

    override update(changes: PropertyValues) {
        debugChanges(this, "updating", changes);
        if (changes.has('model') || changes.has('anchor'))  {
            this._anchor = this.anchor ? (this.model.scene.getNodeByName(this.anchor) as TransformNode) : null;
            this.disabled = (this._anchor == null);
        }
        if (changes.has('_anchor')) this.#attach();
        if (changes.has('color')) this._spot.color = this.color;
        if (changes.has('size')) this._spot.diameter = this.size;
        
        super.update(changes);
    }


}
