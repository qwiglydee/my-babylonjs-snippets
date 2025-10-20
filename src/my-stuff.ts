import { consume } from "@lit/context";
import { ReactiveElement } from "lit";
import { customElement, property } from "lit/decorators.js";

import type { PickingInfo } from "@babylonjs/core/Collisions/pickingInfo";
import { KeyboardEventTypes, type KeyboardInfo } from "@babylonjs/core/Events/keyboardEvents";
import { PBRMetallicRoughnessMaterial } from "@babylonjs/core/Materials/PBR/pbrMetallicRoughnessMaterial";
import { Vector3 } from "@babylonjs/core/Maths";
import type { Mesh } from "@babylonjs/core/Meshes/mesh";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import type { Nullable } from "@babylonjs/core/types";

import { sceneCtx, pickCtx, type SceneCtx } from "./context";
import { assertNonNull } from "./utils/asserts";
import { debug } from "./utils/debug";

@customElement("my-stuff")
export class MyStuffElem extends ReactiveElement {
    @consume({ context: sceneCtx, subscribe: true })
    ctx!: SceneCtx;

    @consume({ context: pickCtx, subscribe: true })
    pick: Nullable<PickingInfo> = null;

    @property({ type: Number })
    radius = 10;

    @property({ type: Number })
    size = 1;

    @property({ type: Number })
    count = 3;

    override connectedCallback(): void {
        super.connectedCallback();
        this.#init();
        this.#create();
    }

    #randomLoc() {
        const rndc = () => (Math.random() * 2 - 1) * this.radius;
        const snap = (coord: number) => this.size * (0.5 + Math.floor(coord / this.size));

        return new Vector3(snap(rndc()), 0.5 * this.size, snap(rndc()));
    }

    _defaultMat!: PBRMetallicRoughnessMaterial;

    _createItem = (type: number) => {
        debug(this, "creating", { type });
        const scene = this.ctx!.scene;

        let idx = (1 + (scene.meshes.length ?? 0)).toString().padStart(3, "0");
        let mesh: Mesh;
        switch (type) {
            case 0:
                mesh = MeshBuilder.CreateBox(`box.${idx}`, { size: this.size }, scene);
                break;
            case 1:
                mesh = MeshBuilder.CreateSphere(`ball.${idx}`, { diameter: this.size }, scene);
                break;
            case 2:
                mesh = MeshBuilder.CreateCylinder(`cone.${idx}`, { height: this.size, diameterBottom: this.size, diameterTop: 0 }, scene);
                break;
            case 3:
                mesh = MeshBuilder.CreateIcoSphere(`diamond.${idx}`, { radius: 0.5 * this.size, subdivisions: 1 }, scene);
                break;
            default:
                throw Error();
        }
        mesh.position = this.#randomLoc();
        mesh.material = this._defaultMat;
        return mesh;
    };

    async #init() {
        debug(this, "initializing");
        this._defaultMat = new PBRMetallicRoughnessMaterial("default", this.ctx!.scene);
        this._defaultMat.metallic = 0;
        this._defaultMat.roughness = 0.5;    
    }

    async #create() {
        if(!this.count) return;
        for (let i = 0; i < this.count; i++) this._createItem(i % 4);
    }

    createItem() {
        assertNonNull(this.ctx?.scene);
        this._createItem(Math.floor(Math.random() * 3));
    }
}
