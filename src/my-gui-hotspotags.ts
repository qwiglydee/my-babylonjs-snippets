import { consume } from "@lit/context";
import { ReactiveElement, type PropertyValues } from "lit";
import { customElement, state, property } from "lit/decorators.js";

import type { Scene } from "@babylonjs/core/scene";
import { AdvancedDynamicTexture } from "@babylonjs/gui/2D/advancedDynamicTexture";
import type { TransformNode } from "@babylonjs/core/Meshes/transformNode";

import { Spot } from "./gui2d/spot";
import { sceneCtx, type ModelCtx, modelCtx, guiCtx } from "./context";
import { debug, debugChanges } from "./utils/debug";
import { PointerEventTypes, PointerInfo } from "@babylonjs/core/Events/pointerEvents";

@customElement("my-gui-hotspotags")
export class MyGUIHotspotTagsElem extends ReactiveElement {
    @consume({ context: sceneCtx, subscribe: false })
    scene!: Scene;

    @consume({ context: guiCtx, subscribe: false })
    gui!: AdvancedDynamicTexture;

    @consume({ context: modelCtx, subscribe: true })
    @state()
    model!: ModelCtx;

    @property()
    tag: string = "hotspot";

    @property()
    color: string = "#f0f080";

    @property({ type: Number })
    alpha = 0.5;

    @property({ type: Number })
    size: number = 24;

    @property({ type: Boolean })
    blinking = false;

    _anchors: TransformNode[] = []; 
    _spots: Spot[] = [];

    override connectedCallback(): void {
        super.connectedCallback();
    }
    
    #updateSpots() {
        const tagged = Array.prototype.concat([],
            this.model.scene.getTransformNodesByTags(this.tag),
            this.model.scene.getMeshesByTags(this.tag),
        )

        const todel = this._spots.filter(it => !tagged.includes(it.linkedMesh!))
        this._spots = this._spots.filter(it => tagged.includes(it.linkedMesh!));
        todel.forEach(spot => {
            spot.linkWithMesh(null);
            spot.dispose();
            this.gui.removeControl(spot);
        });

        const toadd = tagged.filter(node => !this._anchors.includes(node));
        toadd.forEach(node => this._spots.push(this.#createSpot(node)));
        this._anchors = this._spots.map(it => it.linkedMesh) as TransformNode[];
    }

    #createSpot(node: TransformNode) {
        const spot = new Spot(`${node.id}-hotspot`);
        this.gui.addControl(spot);
        spot.color = this.color;
        spot.diameter = this.size;
        spot.isVisible = true;
        spot.blinking = this.blinking;
        spot.linkWithMesh(node);
        return spot;
    }

    #onpointer: any;

    #initBlinking() {
        this._spots.forEach(it => it.blinking = this.blinking);

        if (this.blinking) {
            this.#onpointer = this.model.scene.onPointerObservable.add((info: PointerInfo) => {
                if (info.type == PointerEventTypes.POINTERDOWN) {
                    if (!info.pickInfo?.pickedMesh) this.blink();
                }
            });
        } else if (this.#onpointer) {
            this.#onpointer.remove();
            this.#onpointer = null;
        }
    }

    override update(changes: PropertyValues) {
        debugChanges(this, "updating", changes);
        if (changes.has('model') || changes.has('tag')) this.#updateSpots();
        if (changes.has("color")) this._spots.forEach(it => it.color = this.color);
        if (changes.has("size")) this._spots.forEach(it => it.diameter = this.size);
        if (changes.has("blinking")) this.#initBlinking();
        super.update(changes);
    }

    blink() {
        this._spots.forEach(it => it.blink(this.scene));
    }
}
