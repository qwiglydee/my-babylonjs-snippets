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
        const snap = (coord: number) => Math.floor(coord / this.size) * this.size; 

        return new V3(snap(rndc()), 0.5 * this.size, snap(rndc()));
    }

    async #createStuff() {
        const createItem = (i: number, type: number) => {
            i = i + 1;
            switch(type) {
                case 0:
                    return MeshBuilder.CreateBox(`box.${i}`, { size: this.size }, this.ctx!.scene);
                case 1:
                    return MeshBuilder.CreateSphere(`ball.${i}`, { diameter: this.size }, this.ctx!.scene);
                case 2:
                    return MeshBuilder.CreateCylinder(`cone.${i}`, { height: this.size, diameterBottom: this.size, diameterTop: 0 }, this.ctx!.scene);
                case 3:
                    return MeshBuilder.CreateIcoSphere(`diamond.${i}`, { radius: 0.5 * this.size, subdivisions: 1 }, this.ctx!.scene);
                default:
                    throw Error();
            }
        }

        let mesh: Mesh;
        let _meshes: Mesh[] = [];

        for(let i = 0; i < this.count; i++) {
            mesh = createItem(i, i % 4);
            mesh.position = this.#randomLoc();
            _meshes.push(mesh);
        }

        await this.ctx!.scene.whenReadyAsync(true);
        (this.ctx!.camera as ArcRotateCamera).zoomOn(_meshes, true);
    }
}