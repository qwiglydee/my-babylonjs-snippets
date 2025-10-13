import { consume } from "@lit/context";
import { ReactiveElement, type PropertyValues } from "lit";
import { customElement, property, state } from "lit/decorators.js";

import type { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import type { Nullable } from "@babylonjs/core/types";
import type { AdvancedDynamicTexture } from "@babylonjs/gui/2D/advancedDynamicTexture";

import { guiCtx, sceneCtx, type SceneCtx } from "./context";
import { debug } from "./utils/debug";
import { PointerEventTypes, type PointerInfo } from "@babylonjs/core/Events/pointerEvents";
import { Spot } from "./lib/guispot";


@customElement("my-gui-hotspot")
export class MyGUIHotspotElem extends ReactiveElement {
    @consume({ context: sceneCtx, subscribe: true })
    @state()
    ctx: Nullable<SceneCtx> = null;
    
    @consume({ context: guiCtx, subscribe: false })
    gui!: AdvancedDynamicTexture;

    @property({ type: Number })
    zIndex = 0;

    @property()
    anchor: Nullable<string> = null;

    @state()
    _anchor: Nullable<TransformNode> = null;

    @property({ type: Boolean, reflect: true })
    disabled = false;

    @property()
    color: string = "#f0f020";

    @property({ type: Number })
    alpha = 0.5;

    @property({ type: Number })
    size: number = 48;

    @property({ type: Boolean })
    blinking = false;

    protected override shouldUpdate(_changes: PropertyValues): boolean {
        return this.ctx != null;
    }

    override update(changes: PropertyValues) {
        if (!this.hasUpdated) this.#init();

        if (changes.has('ctx') || changes.has('anchor')) {
            this._anchor = this.anchor ? (this.ctx?.scene.getNodeByName(this.anchor) as TransformNode) : null;
        }

        if (changes.has('_anchor')) {
            this.#attach();
        }

        if (changes.has('blinking')) {
            this._spot.blinking = this.blinking;
            this._spot.alpha = this.blinking ? 0 : this.alpha;
        }

        if (changes.has('color')) {
            this._spot.color = this.color;
        }

        if (changes.has('size')) {
            this._spot.width = `${this.size}px`;
            this._spot.height = `${this.size}px`;
        }

        if (changes.has('zIndex')) {
            this._spot.zIndex = this.zIndex;
        }

        super.update(changes);
    }

    _spot!: Spot;

    #init() {
        debug(this, "creating");
        const spot = new Spot(`(hotspot-${this.id})`);
        spot.color = this.color;
        spot.widthInPixels = this.size;
        spot.heightInPixels = this.size;
        spot.isVisible = false;
        spot.zIndex = this.zIndex;
        spot.blinking = this.blinking;
        this._spot = spot;
        this.gui.addControl(this._spot);

        this._spot.alpha = this.blinking ? 0 : this.alpha;

        this.ctx!.scene.onPointerObservable.add((info: PointerInfo) => {
            if (info.type == PointerEventTypes.POINTERDOWN) {
                if (this.blinking && this._anchor) this.blink();
            }
        })
    }

    #attach() {
        this._spot.linkWithMesh(this._anchor);
        this._spot.isVisible = (this._anchor !== null);
    }

    toggle(enable?: boolean) {
        if (!this._anchor) return;
        enable = enable ?? !this._spot.isVisible;
        this._spot.isVisible = enable;
    }

    blink() {
        if (!this._spot.isVisible) return;
        this._spot.blink(this.ctx!.scene);
    }
}