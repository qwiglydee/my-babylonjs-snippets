import { consume } from "@lit/context";
import { ReactiveElement, type PropertyValues } from "lit";
import { customElement, property } from "lit/decorators.js";

import { Texture } from "@babylonjs/core/Materials/Textures/texture";
import { Color3 } from "@babylonjs/core/Maths";
import { CreateGround } from "@babylonjs/core/Meshes/Builders/groundBuilder";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import type { Nullable } from "@babylonjs/core/types";
import { GridMaterial } from "@babylonjs/materials/grid/gridMaterial";

import { babylonCtx, type BabylonCtx } from "./context";
import { debugChanges } from "./utils/debug";

const GROUND_TXT = new URL("./assets/ground.png?inline", import.meta.url);

@customElement("my-ground")
export class MyGroundElem extends ReactiveElement {
    @consume({ context: babylonCtx, subscribe: true })
    ctx: Nullable<BabylonCtx> = null;

    @property({ type: Number })
    radius: Nullable<number> = null;

    @property()
    color: string = "#20f0f0";

    @property({ type: Number })
    opacity = 0.5;

    protected override shouldUpdate(_changes: PropertyValues): boolean {
        return this.ctx != null;
    }

    override update(changes: PropertyValues) {
        if (!this.hasUpdated) this.#createStuff();
        else if (changes.size) this.#adjustStuff(changes);
        super.update(changes);
    }

    _mesh!: Mesh;
    _mtl!: GridMaterial;

    #createStuff() {
        const scene = this.ctx!.utils.utilityLayerScene;
        const size = this.radius ? this.radius * 2 : this.ctx!.size;

        this._mesh = CreateGround("BackgroundGround", { width: 1.0, height: 1.0, subdivisions: 1 }, scene);
        this._mesh.isPickable = false;
        this._mesh.scaling.x = size;
        this._mesh.scaling.z = size;

        this._mtl = new GridMaterial("BackgroundGround", scene);
        this._mtl.lineColor = Color3.FromHexString(this.color);
        this._mtl.majorUnitFrequency = 8;
        this._mtl.minorUnitVisibility = 0.825;
        this._mtl.backFaceCulling = false;
        this._mtl.gridRatio = 1 / size;
        this._mtl.opacity = this.opacity;
        this._mtl.opacityTexture = new Texture(GROUND_TXT.href, scene);

        this._mesh.material = this._mtl;
    }

    #adjustStuff(changes: PropertyValues) {
        debugChanges(this, "updating", changes);
        if (changes.has("radius")) {
            const size = this.radius ? this.radius * 2 : this.ctx!.size;
            this._mesh.scaling.x = size;
            this._mesh.scaling.z = size;
            this._mtl.gridRatio = 1 / size;
        }

        if (changes.has("opacity")) {
            this._mtl.opacity = this.opacity;
        }

        if (changes.has("color")) {
            this._mtl.lineColor = Color3.FromHexString(this.color);
        }
    }
}
