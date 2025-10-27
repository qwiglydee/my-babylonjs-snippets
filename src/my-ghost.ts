import { consume } from "@lit/context";
import { ReactiveElement, type PropertyValues } from "lit";
import { customElement, state } from "lit/decorators.js";

import type { PickingInfo } from "@babylonjs/core/Collisions/pickingInfo";
import { BackgroundMaterial } from "@babylonjs/core/Materials/Background/backgroundMaterial";
import { CreateBox } from "@babylonjs/core/Meshes/Builders/boxBuilder";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import type { Scene } from "@babylonjs/core/scene";
import type { Nullable } from "@babylonjs/core/types";

import { GhostBehavior } from "./behaviors/ghost";
import { pickCtx, sceneCtx } from "./context";

@customElement("my-ghost")
export class MyGhostElem extends ReactiveElement {
    @consume({ context: sceneCtx, subscribe: false })
    scene!: Scene;

    @consume({ context: pickCtx, subscribe: true })
    @state()
    pick: Nullable<PickingInfo> = null;

    override connectedCallback(): void {
        super.connectedCallback();
        this.#init();
    }

    _mesh!: Mesh;
    _bhv!: GhostBehavior;
    
    #init() {
        this._mesh = CreateBox("(ghost)", {}, this.scene);
        this._mesh.isPickable = false;
        this._mesh.material = new BackgroundMaterial("(ghost)", this.scene);
        this._mesh.material.alpha = 0.25;
        this._mesh.material.wireframe = true;
        
        this._bhv = new GhostBehavior();
        this._bhv.attach(this._mesh);
    }

    override update(changes: PropertyValues) {
        if (changes.has('pick')) {
            this._bhv.targetMesh = this.pick ? this.pick.pickedMesh : null;
        }
        super.update(changes);
    }
}
