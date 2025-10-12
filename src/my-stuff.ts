import { consume } from "@lit/context";
import { ReactiveElement, type PropertyValues } from "lit";
import { customElement, property } from "lit/decorators.js";

import type { PickingInfo } from "@babylonjs/core/Collisions/pickingInfo";
import { KeyboardEventTypes, type KeyboardInfo } from "@babylonjs/core/Events/keyboardEvents";
import { PBRMetallicRoughnessMaterial } from "@babylonjs/core/Materials/PBR/pbrMetallicRoughnessMaterial";
import { Vector3 } from "@babylonjs/core/Maths";
import type { Mesh } from "@babylonjs/core/Meshes/mesh";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import type { Nullable } from "@babylonjs/core/types";

import { babylonCtx, pickCtx, type BabylonCtx } from "./context";
import { assertNonNull } from "./utils/asserts";
import { debug } from "./utils/debug";

@customElement("my-stuff")
export class MyStuffElem extends ReactiveElement {
    @consume({ context: babylonCtx, subscribe: true })
    ctx: Nullable<BabylonCtx> = null;

    @consume({ context: pickCtx, subscribe: true })
    pick: Nullable<PickingInfo> = null;

    @property({ type: Number })
    radius: Nullable<number> = null;

    @property({ type: Number })
    size = 1;

    @property({ type: Number })
    count = 3;

    @property({ type: Boolean })
    shuffling = false;

    protected override shouldUpdate(_changes: PropertyValues): boolean {
        return this.ctx != null;
    }

    override update(changes: PropertyValues) {
        if (!this.hasUpdated) {
            this.#initShuffling();
            this.#createStuff();
        }
        super.update(changes);
    }

    #randomLoc() {
        const radius = this.radius ?? this.ctx!.worldSize * 0.5;

        const rndc = () => (Math.random() * 2 - 1) * radius;
        const snap = (coord: number) => this.size * (0.5 + Math.floor(coord / this.size));

        return new Vector3(snap(rndc()), 0.5 * this.size, snap(rndc()));
    }

    _defaultMat!: PBRMetallicRoughnessMaterial;

    createItem() {
        assertNonNull(this.ctx?.scene);
        this._createItem(Math.floor(Math.random() * 3));
    }

    _createItem = (type: number) => {
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

    #createStuff() {
        debug(this, "creating", { count: this.count });

        this._defaultMat = new PBRMetallicRoughnessMaterial("default", this.ctx!.scene);
        this._defaultMat.metallic = 0;
        this._defaultMat.roughness = 0.5;

        for (let i = 0; i < this.count; i++) this._createItem(i % 4);
    }

    #initShuffling() {
        this.ctx!.scene.onKeyboardObservable.add((info: KeyboardInfo) => {
            let selected = this.pick?.pickedMesh;
            if (!selected) return;
            if (info.type != KeyboardEventTypes.KEYDOWN && "gsr".includes(info.event.key)) {
                switch (info.event.key) {
                    case "g":
                        const radius = this.radius ?? this.ctx!.worldSize * 0.5;
                        selected.position.x = (Math.random() * 2 - 1) * radius;
                        selected.position.z = (Math.random() * 2 - 1) * radius;

                        break;
                    case "s":
                        selected.scaling.x = (Math.random() * 0.75 + 0.25) * this.size;
                        selected.scaling.z = (Math.random() * 0.75 + 0.25) * this.size;
                        break;
                    case "r":
                        selected.rotation.z = (Math.random() * 2 + 1) * Math.PI;
                        selected.rotation.x = (Math.random() * 2 + 1) * Math.PI;
                        break;
                }
            }
            this.ctx!.scene.onModelUpdatedObservable.notifyObservers([selected]);
        });
    }
}
