import { consume } from "@lit/context";
import { ReactiveElement, type PropertyValues } from "lit";
import { customElement, property, state } from "lit/decorators.js";

import { Texture } from "@babylonjs/core/Materials/Textures/texture";
import { Color3 } from "@babylonjs/core/Maths";
import { CreateGround } from "@babylonjs/core/Meshes/Builders/groundBuilder";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import type { Scene } from "@babylonjs/core/scene";
import type { Nullable } from "@babylonjs/core/types";
import { GridMaterial } from "@babylonjs/materials/grid/gridMaterial";

import { sceneCtx, utilsCtx, type SceneCtx } from "./context";
import { assertNonNull } from "./utils/asserts";
import { debug, debugChanges } from "./utils/debug";

const GROUND_TXT = new URL("./assets/ground.png?inline", import.meta.url);

@customElement("my-ground")
export class MyGroundElem extends ReactiveElement {
    @consume({ context: sceneCtx, subscribe: true })
    @state()
    ctx: Nullable<SceneCtx> = null;

    @consume({ context: utilsCtx, subscribe: false })
    utils!: Scene;

    @property({ type: Number })
    size: Nullable<number> = null;

    @property({ type: Boolean })
    autoSize = false;

    @property()
    color: string = "#20f0f0";

    @property({ type: Number })
    opacity = 0.5;

    @property({ type: Number })
    opacity2 = 0.75;

    @state()
    _size: number = 0;

    protected override shouldUpdate(_changes: PropertyValues): boolean {
        return this.ctx != null;
    }

    override update(changes: PropertyValues) {
        if (!this.hasUpdated) this.#create();

        debugChanges(this, "updating", changes);

        if ((changes.has("ctx") || changes.has("autoSize")) && this.autoSize) this._adjust();
        
        if (changes.has("size") && this.size) this._size = this.size;

        if (changes.has("_size")) this._resize(this._size);

        if (changes.has("opacity")) {
            this._mtl.opacity = this.opacity;
        }

        if (changes.has("color")) {
            this._mtl.lineColor = Color3.FromHexString(this.color);
        }

        super.update(changes);
    }

    _mesh!: Mesh;
    _mtl!: GridMaterial;

    #create() {
        debug(this, "creating");
        assertNonNull(this.ctx);
        const scene = this.utils;

        this._mesh = CreateGround("(Ground)", { width: 1.0, height: 1.0, subdivisions: 1 }, scene);
        this._mesh.isPickable = false;

        this._mtl = new GridMaterial("(Ground)", scene);
        this._mtl.lineColor = Color3.FromHexString(this.color);
        this._mtl.majorUnitFrequency = 8;
        this._mtl.minorUnitVisibility = this.opacity2;
        this._mtl.backFaceCulling = false;
        this._mtl.opacity = this.opacity;
        this._mtl.opacityTexture = new Texture(GROUND_TXT.href, scene);

        this._mesh.material = this._mtl;

        if (this.size) this._size = this.size;
        else this._adjust();
        this._resize(this._size);
    }

    _adjust() {
        assertNonNull(this.ctx);
        if (this.ctx.bounds) {
            this._size = 3 * Math.max(
                Math.abs(this.ctx.bounds.minimum.x), 
                Math.abs(this.ctx.bounds.minimum.z), 
                Math.abs(this.ctx.bounds.maximum.x), 
                Math.abs(this.ctx.bounds.maximum.z), 
            )
        } else {
            this._size = 2 * Math.max(this.ctx.scene.worldSize.x, this.ctx.scene.worldSize.z);
        }
    }

    _resize(size: number) {
        debug(this, "resizing", { size });
        this._mesh.scaling.x = size;
        this._mesh.scaling.z = size;
        this._mtl.gridRatio = 1 / size;
    }
}
