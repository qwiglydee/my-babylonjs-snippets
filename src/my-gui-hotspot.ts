import { consume } from "@lit/context";
import { ReactiveElement, type PropertyValues } from "lit";
import { customElement, property, state } from "lit/decorators.js";

import type { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import type { Nullable } from "@babylonjs/core/types";
import type { AdvancedDynamicTexture } from "@babylonjs/gui/2D/advancedDynamicTexture";
import { Container } from "@babylonjs/gui/2D/controls/container";
import { Ellipse } from "@babylonjs/gui/2D/controls/ellipse";
import { Animation } from "@babylonjs/core/Animations/animation";

import { guiCtx, sceneCtx, type SceneCtx } from "./context";
import { debug } from "./utils/debug";
import { PointerEventTypes, type PointerInfo } from "@babylonjs/core/Events/pointerEvents";


function createBlinking() {
    const a = new Animation("blinking", "alpha", 24, Animation.ANIMATIONTYPE_FLOAT, Animation.ANIMATIONLOOPMODE_CONSTANT); 
    a.setKeys([
        { frame: 0, value: 0 },
        { frame: 3, value: 0.75},
        { frame: 6, value: 1.0},
        { frame: 9, value: 0.75},
        { frame: 12, value: 0 },
    ])
    return a;
}


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
    color: string = "yellow";

    @property({ type: Number })
    alpha = 0.5;

    @property({ type: Number })
    size: number = 32;

    @property({ type: Boolean })
    blinking = false;

    static _blinking: Animation = createBlinking();

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
            this._spot.alpha = this.blinking ? 0 : this.alpha;
        }

        if (changes.has('color')) {
            this._spot.background = this.color;
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

    _spot!: Container;

    #init() {
        debug(this, "creating");
        const spot = new Ellipse(`(hotspot-${this.id})`);
        spot.background = this.color;
        spot.thickness = 0;
        spot.width = `${this.size}px`;
        spot.height = `${this.size}px`;
        spot.isVisible = false;
        spot.zIndex = this.zIndex;
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
        if (!this._spot.animations?.length) this._spot.animations = [MyGUIHotspotElem._blinking];
        this.ctx!.scene.beginAnimation(this._spot, 0, 12, false);
    }
}