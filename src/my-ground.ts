import { consume } from "@lit/context";
import { ReactiveElement, type PropertyValues } from "lit";
import { customElement, property, state } from "lit/decorators.js";

import { Texture } from "@babylonjs/core/Materials/Textures/texture";
import { Color3, Vector2, Vector3 } from "@babylonjs/core/Maths";
import { CreateGround } from "@babylonjs/core/Meshes/Builders/groundBuilder";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import type { Scene } from "@babylonjs/core/scene";
import { GridMaterial } from "@babylonjs/materials/grid/gridMaterial";

import { sceneCtx, utilsCtx, type SceneCtx } from "./context";
import { assertNonNull } from "./utils/asserts";
import { debug } from "./utils/debug";

const GROUND_TXT = new URL("./assets/ground.png?inline", import.meta.url);

@customElement("my-ground")
export class MyGroundElem extends ReactiveElement {
    @consume({ context: sceneCtx, subscribe: true })
    @state()
    ctx!: SceneCtx;

    @consume({ context: utilsCtx, subscribe: false })
    utils!: Scene;

    @property({ type: Number })
    defaultSize: number = 100;

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

    override connectedCallback(): void {
        super.connectedCallback();
        this.#init();
    }

    _mesh!: Mesh;
    _mtl!: GridMaterial;

    #init() {
        debug(this, "initilizing");
        assertNonNull(this.ctx);
        const scene = this.utils;

        this._mesh = CreateGround("(Ground)", { width: 1.0, height: 1.0, subdivisions: 1 }, scene);
        this._mesh.isPickable = false;

        this._mtl = new GridMaterial("(Ground)", scene);
        this._mtl.majorUnitFrequency = 8;
        this._mtl.backFaceCulling = false;
        this._mtl.opacityTexture = new Texture(GROUND_TXT.href, scene);

        this._mesh.material = this._mtl;

        this._size = this.defaultSize;
    }

    #calcSize() {
        return this.ctx.world ? 2 * (new Vector2(this.ctx.world.extendSize.x, this.ctx.world.extendSize.z)).length() : this.defaultSize;
    }

    #resize() {
        debug(this, "resizing", { size: this._size });
        this._mesh.scaling.x = this._size;
        this._mesh.scaling.z = this._size;
        this._mtl.gridRatio = 1 / this._size;
    }

    override update(changes: PropertyValues) {
        if (this.autoSize && (changes.has("ctx") || changes.has("autoSize"))) this._size = this.#calcSize();
        if (!this.autoSize && changes.has('defaultSize')) this._size = this.defaultSize;
        
        if (changes.has("_size")) this.#resize();

        if (changes.has("opacity")) this._mtl.opacity = this.opacity;

        if (changes.has("opacity2")) this._mtl.minorUnitVisibility = this.opacity2;

        if (changes.has("color")) {
            this._mtl.lineColor = Color3.FromHexString(this.color);
        }
        super.update(changes);
    }
}
