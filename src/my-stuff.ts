import { consume } from "@lit/context";
import { ReactiveElement, type PropertyValues } from "lit";
import { customElement, property } from "lit/decorators.js";

import { ArcRotateCamera } from "@babylonjs/core/Cameras/arcRotateCamera";
import { Vector3 as V3 } from "@babylonjs/core/Maths";
import type { Mesh } from "@babylonjs/core/Meshes/mesh";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import type { Nullable } from "@babylonjs/core/types";

import { babylonCtx, type BabylonCtx } from "./context";

@customElement("my-stuff")
export class MyStuffElem extends ReactiveElement {
    @consume({ context: babylonCtx, subscribe: true })
    ctx: Nullable<BabylonCtx> = null;

    @property({ type: Number })
    radius: Nullable<number> = null;

    @property({ type: Number })
    size = 1;

    @property({ type: Number })
    count = 3;

    protected override shouldUpdate(_changes: PropertyValues): boolean {
        return this.ctx != null;
    }

    override update(changes: PropertyValues) {
        if(!this.hasUpdated) this.#createStuff();
        super.update(changes);
    }

    #randomLoc() {
        const radius = this.radius ?? this.ctx!.size * 0.5;

        const rndc = () => (Math.random() * 2 - 1) * radius
        const snap = (coord: number) => this.size * (0.5 + Math.floor(coord / this.size)); 

        return new V3(snap(rndc()), 0.5 * this.size, snap(rndc()));
    }

    _createItem = (type: number, idx: string) => {
        switch(type) {
            case 0:
                return MeshBuilder.CreateBox(`box.${idx}`, { size: this.size }, this.ctx!.scene);
            case 1:
                return MeshBuilder.CreateSphere(`ball.${idx}`, { diameter: this.size }, this.ctx!.scene);
            case 2:
                return MeshBuilder.CreateCylinder(`cone.${idx}`, { height: this.size, diameterBottom: this.size, diameterTop: 0 }, this.ctx!.scene);
            case 3:
                return MeshBuilder.CreateIcoSphere(`diamond.${idx}`, { radius: 0.5 * this.size, subdivisions: 1 }, this.ctx!.scene);
            default:
                throw Error();
        }
    }

    async #createStuff() {
        for(let i = 0; i < this.count; i++) {
            let mesh = this._createItem(i % 4, (i + 1).toString().padStart(3, '0'));
            mesh.position = this.#randomLoc();
        }
    }
}