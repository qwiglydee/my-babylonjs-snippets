import { consume } from "@lit/context";
import { ReactiveElement, type PropertyValues } from "lit";
import { customElement, property, state } from "lit/decorators.js";

import { Texture } from "@babylonjs/core/Materials/Textures/texture";
import { Color3, Vector2 } from "@babylonjs/core/Maths";
import { CreateGround } from "@babylonjs/core/Meshes/Builders/groundBuilder";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import type { Scene } from "@babylonjs/core/scene";
import type { Nullable } from "@babylonjs/core/types";

import { sceneCtx, utilsCtx, type SceneCtx } from "./context";
import { assertNonNull } from "./utils/asserts";
import { BackgroundMaterial } from "@babylonjs/core/Materials/Background/backgroundMaterial";
// import { debug } from "./utils/debug";


@customElement("my-ground-flat")
export class MyFlatGroundElem extends ReactiveElement {
    @consume({ context: sceneCtx, subscribe: true })
    @state()
    ctx!: SceneCtx;

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
    color: string = "#808080";

    @property({ type: Number })
    opacity = 1.0;

    @state()
    _size: number = 0;

    override connectedCallback(): void {
        assertNonNull(this.src, `${this.tagName}.src is required`)
        super.connectedCallback();
        this.#init();
    }

    _ground!: Mesh;
    _material!: BackgroundMaterial;

    #init() {
        // debug(this, "initilizing");
        assertNonNull(this.ctx);
        const scene = this.ctx.scene;

        this._material = new BackgroundMaterial("(Ground)", scene);
        this._material.useRGBColor = false;
        this._material.backFaceCulling = true;
        this._material.diffuseTexture = new Texture(this.src, scene);
        this._material.diffuseTexture.hasAlpha = true;

        this._ground = CreateGround("(Ground)", { width: 1.0, height: 1.0, subdivisions: 1 }, scene);
        scene.markAux(this._ground);
        this._ground.isPickable = false;
        this._ground.material = this._material;

        this._size = this.defaultSize;
    }

    #calcSize() {
        return this.ctx.world ? 2 * (new Vector2(this.ctx.world.extendSize.x, this.ctx.world.extendSize.z)).length() : this.defaultSize;
    }

    #resize() {
        // debug(this, "resizing", { size: this._size });
        this._ground.scaling.x = this._size;
        this._ground.scaling.z = this._size;
    }

    override update(changes: PropertyValues) {
        if (this.autoSize && (changes.has("ctx") || changes.has("autoSize"))) this._size = this.#calcSize();
        if (!this.autoSize && changes.has('defaultSize')) this._size = this.defaultSize;
        if (changes.has("_size")) this.#resize();
        if (changes.has("opacity")) this._material.alpha = this.opacity;
        if (changes.has("color")) this._material.primaryColor = Color3.FromHexString(this.color);
        super.update(changes);
    }
}
