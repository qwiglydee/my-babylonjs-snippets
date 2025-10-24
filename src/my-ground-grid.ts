import { consume } from "@lit/context";
import { ReactiveElement, type PropertyValues } from "lit";
import { customElement, property, state } from "lit/decorators.js";

import { Texture } from "@babylonjs/core/Materials/Textures/texture";
import { Color3, Vector2 } from "@babylonjs/core/Maths";
import { CreateGround } from "@babylonjs/core/Meshes/Builders/groundBuilder";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import type { Scene } from "@babylonjs/core/scene";
import { GridMaterial } from "@babylonjs/materials/grid/gridMaterial";

import { sceneCtx, utilsCtx, type SceneCtx } from "./context";
import { assertNonNull } from "./utils/asserts";
import { debug } from "./utils/debug";
import type { Nullable } from "@babylonjs/core/types";


@customElement("my-ground-grid")
export class MyGridGroundElem extends ReactiveElement {
    @consume({ context: sceneCtx, subscribe: true })
    @state()
    ctx!: SceneCtx;

    @consume({ context: utilsCtx, subscribe: false })
    utils!: Scene;

    @property()
    src: Nullable<string> = null;

    /** use primary scene instead of utils */
    @property({ type: Boolean })
    real = false;

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
        assertNonNull(this.src, `${this.tagName}.src is required`)
        super.connectedCallback();
        this.#init();
    }

    _ground!: Mesh;
    _material!: GridMaterial;

    #init() {
        debug(this, "initilizing");
        assertNonNull(this.ctx);
        const scene = this.real ? this.ctx.scene : this.utils;

        this._material = new GridMaterial("(Ground)", scene);
        this._material.majorUnitFrequency = 8;
        this._material.backFaceCulling = false;
        this._material.opacityTexture = new Texture(this.src, scene);

        this._ground = CreateGround("(Ground)", { width: 1.0, height: 1.0, subdivisions: 1 }, scene);
        if (this.real) this.ctx.scene.markAux(this._ground);
        this._ground.isPickable = false;
        this._ground.material = this._material;

        this._size = this.defaultSize;
    }

    #calcSize() {
        return this.ctx.world ? 2 * (new Vector2(this.ctx.world.extendSize.x, this.ctx.world.extendSize.z)).length() : this.defaultSize;
    }

    #resize() {
        debug(this, "resizing", { size: this._size });
        this._ground.scaling.x = this._size;
        this._ground.scaling.z = this._size;
        this._material.gridRatio = 1 / this._size;
    }

    override update(changes: PropertyValues) {
        if (this.autoSize && (changes.has("ctx") || changes.has("autoSize"))) this._size = this.#calcSize();
        if (!this.autoSize && changes.has('defaultSize')) this._size = this.defaultSize;
        
        if (changes.has("_size")) this.#resize();

        if (changes.has("opacity")) this._material.opacity = this.opacity;

        if (changes.has("opacity2")) this._material.minorUnitVisibility = this.opacity2;

        if (changes.has("color")) {
            this._material.lineColor = Color3.FromHexString(this.color);
        }
        super.update(changes);
    }
}
