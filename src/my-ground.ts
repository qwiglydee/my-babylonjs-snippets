import { consume } from "@lit/context";
import { ReactiveElement, type PropertyValues } from "lit";
import { customElement, property, state } from "lit/decorators.js";

import { Texture } from "@babylonjs/core/Materials/Textures/texture";
import { Color3 } from "@babylonjs/core/Maths";
import { CreateGround } from "@babylonjs/core/Meshes/Builders/groundBuilder";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import type { UtilityLayerRenderer } from "@babylonjs/core/Rendering/utilityLayerRenderer";
import type { Nullable } from "@babylonjs/core/types";
import { GridMaterial } from "@babylonjs/materials/grid/gridMaterial";

import { babylonCtx, utilsCtx, type BabylonCtx } from "./context";
import { assertNonNull } from "./utils/asserts";
import { debug } from "./utils/debug";

const GROUND_TXT = new URL("./assets/ground.png?inline", import.meta.url);

@customElement("my-ground")
export class MyGroundElem extends ReactiveElement {
    @consume({ context: babylonCtx, subscribe: true })
    @state()
    ctx: Nullable<BabylonCtx> = null;

    @consume({ context: utilsCtx, subscribe: false })
    utils!: UtilityLayerRenderer;

    @property({ type: Boolean })
    autoSize = false;

    @property({ type: Number })
    radius: Nullable<number> = null;

    @property()
    color: string = "#20f0f0";

    @property({ type: Number })
    opacity = 0.5;

    @property({ type: Number })
    opacity2 = 0.75;

    protected override shouldUpdate(_changes: PropertyValues): boolean {
        return this.ctx != null && this.utils != null;
    }

    override update(changes: PropertyValues) {
        if (!this.hasUpdated) this.#create();
        else {
            if (this.autoSize) {
                if (changes.has("ctx") || changes.has("autoSize")) {
                    this.#resize(4 * Math.max(this.ctx!.bounds.max.length(), this.ctx!.bounds.min.length()));
                }
            } else {
                if (changes.has("radius")) {
                    this.#resize(this.radius ? this.radius * 2 : this.ctx!.worldSize);
                }
            }

            if (changes.has("opacity")) {
                this._mtl.opacity = this.opacity;
            }

            if (changes.has("color")) {
                this._mtl.lineColor = Color3.FromHexString(this.color);
            }
        }

        super.update(changes);
    }

    _mesh!: Mesh;
    _mtl!: GridMaterial;

    #create() {
        assertNonNull(this.ctx);
        const scene = this.utils.utilityLayerScene;
        const size = this.radius ? this.radius * 2 : this.ctx.worldSize;

        this._mesh = CreateGround("(Ground)", { width: 1.0, height: 1.0, subdivisions: 1 }, scene);
        this._mesh.isPickable = false;
        this._mesh.scaling.x = size;
        this._mesh.scaling.z = size;

        this._mtl = new GridMaterial("(Ground)", scene);
        this._mtl.lineColor = Color3.FromHexString(this.color);
        this._mtl.majorUnitFrequency = 8;
        this._mtl.minorUnitVisibility = this.opacity2;
        this._mtl.backFaceCulling = false;
        this._mtl.gridRatio = 1 / size;
        this._mtl.opacity = this.opacity;
        this._mtl.opacityTexture = new Texture(GROUND_TXT.href, scene);

        this._mesh.material = this._mtl;

        this.#resize(size);
    }

    #resize(size: number) {
        debug(this, "resizing", { size });
        this._mesh.scaling.x = size;
        this._mesh.scaling.z = size;
        this._mtl.gridRatio = 1 / size;
    }
}
