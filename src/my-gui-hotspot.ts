import { consume } from "@lit/context";
import { ReactiveElement, type PropertyValues } from "lit";
import { customElement, property, state } from "lit/decorators.js";

import type { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import type { Nullable } from "@babylonjs/core/types";
import type { AdvancedDynamicTexture } from "@babylonjs/gui/2D/advancedDynamicTexture";
import { Container } from "@babylonjs/gui/2D/controls/container";
import { Ellipse } from "@babylonjs/gui/2D/controls/ellipse";

import { guiCtx, sceneCtx, type SceneCtx } from "./context";
import { debug } from "./utils/debug";

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

    @property()
    color: string = "yellow";

    @property({ type: Number })
    size: number = 16;

    protected override shouldUpdate(_changes: PropertyValues): boolean {
        return this.ctx != null;
    }

    override update(changes: PropertyValues) {
        if (!this.hasUpdated) {
            this.#init();
            this._retach();
        } else {
            if (changes.has('ctx') || changes.has('anchor')) this._retach();
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
        }
        super.update(changes);
    }

    _spot!: Container;

    #init() {
        debug(this, "creating");
        const spot = new Ellipse(`(hotspot-${this.id})`);
        spot.background = this.color;
        spot.alpha = 0.5;
        spot.width = `${this.size}px`;
        spot.height = `${this.size}px`;
        spot.isVisible = false;
        spot.zIndex = this.zIndex;
        this._spot = spot;
        this.gui.addControl(this._spot);
    }

    _retach() {
        const node = this.anchor ? this.ctx?.scene.getNodeByName(this.anchor) : null;
        if (node) this.#attach(node as TransformNode); else this.#detach();
    }

    #attach(node: TransformNode) {
        if (this._spot.linkedMesh === node) return;
        if (this._spot.linkedMesh) this.#detach();
        debug(this, "attaching", { anchor: node.name });
        this._spot.linkWithMesh(node);
        this._spot.isVisible = true;
    }

    #detach() {
        if (!this._spot.linkedMesh) return;
        debug(this, "detaching", { anchor: this._spot.linkedMesh?.name });
        this._spot.linkWithMesh(null);
        this._spot.isVisible = false;
    }
}