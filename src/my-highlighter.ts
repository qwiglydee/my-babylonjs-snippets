import { consume } from "@lit/context";
import { ReactiveElement, type PropertyValues } from "lit";
import { customElement, property, state } from "lit/decorators.js";

import type { PickingInfo } from "@babylonjs/core/Collisions/pickingInfo";
import "@babylonjs/core/Layers/effectLayerSceneComponent";
import { HighlightLayer } from "@babylonjs/core/Layers/highlightLayer";
import { Color3 } from "@babylonjs/core/Maths";
import type { Mesh } from "@babylonjs/core/Meshes/mesh";
import type { Scene } from "@babylonjs/core/scene";
import type { Nullable } from "@babylonjs/core/types";

import { pickCtx, sceneCtx } from "./context";
import { debug } from "./utils/debug";

@customElement("my-highlighter")
export class MySomethingElem extends ReactiveElement {
    @consume({ context: sceneCtx, subscribe: false })
    scene!: Scene;

    @consume({ context: pickCtx, subscribe: true })
    @state()
    pick: Nullable<PickingInfo> = null;

    @property()
    color: string = "#ffffff";

    _color!: Color3;

    highlighter!: HighlightLayer;

    override connectedCallback(): void {
        super.connectedCallback();
        this.#init()
    }

    #init() {
        debug(this, "initilizing");
        this.highlighter = new HighlightLayer("(highlighter)", this.scene);
    }

    override update(changes: PropertyValues) {
        if (changes.has('color')) this._color = Color3.FromHexString(this.color);
        if (changes.has('pick')) {
            const picked = this.pick?.pickedMesh ?? null;
            if (picked) this._highlight(picked as Mesh);
            else this.clear();
        }
        super.update(changes);
    }

    highlight(mesh: Mesh, color: Color3) {
        this.highlighter.addMesh(mesh, color);
    }

    clear() {
        this.highlighter.removeAllMeshes();
    }

    _highlight(mesh: Mesh) {
        if (!this.highlighter.hasMesh(mesh)) {
            debug(this, "highlighing", mesh.id);
            this.clear();
            this.highlight(mesh, this._color);
        }
    }
}
