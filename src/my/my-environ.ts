import { consume } from "@lit/context";
import { ReactiveElement, type PropertyValues } from "lit";
import { customElement, property } from "lit/decorators.js";

import "@babylonjs/core/Helpers/sceneHelpers";
import { BackgroundMaterial } from "@babylonjs/core/Materials/Background/backgroundMaterial";
import { CubeTexture } from "@babylonjs/core/Materials/Textures/cubeTexture";
import { Texture } from "@babylonjs/core/Materials/Textures/texture";
import { CreateBox } from "@babylonjs/core/Meshes/Builders/boxBuilder";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { Tags } from "@babylonjs/core/Misc/tags";
import type { Scene } from "@babylonjs/core/scene";
import type { Nullable } from "@babylonjs/core/types";
import { assertNonNull } from "@utils/asserts";
import { debug } from "@utils/debug";
import { WithoutShadow } from "@utils/noshadow";

import { sceneCtx } from "./context";

@customElement("my-environ")
export class MyEnvironElem extends WithoutShadow(ReactiveElement) {
    @consume({ context: sceneCtx, subscribe: false })
    scene!: Scene;

    @property()
    src: Nullable<string> = null;

    @property({ type: Number})
    size = 1000;

    @property({ type: Number })
    envIntens = 1.0;

    @property({ type: Boolean })
    sky = false;

    @property({ type: Number })
    skyIntens = 0.5;

    @property({ type: Number })
    skyBlur = 0.5;

    override connectedCallback(): void {
        assertNonNull(this.src, `${this.tagName}.src is required`)
        super.connectedCallback();
        this.#init();
    }

    async #init() {
        await this.#initEnv();
        if (this.sky) await this.#initSky();
    }

    static _loadTextureAsync(scene: Scene, url: string): Promise<CubeTexture> {
        return new Promise((resolve, reject) => {
            let txt = new CubeTexture(url, scene, {
                noMipmap: false,
                prefiltered: true,
                createPolynomials: false,
                onLoad() { resolve(txt) },
                onError(msg) { reject(msg) }
            });
        })
    }

    _envTxt: Nullable<CubeTexture> = null;
    _skyTxt: Nullable<CubeTexture> = null;
    _skyMat: Nullable<BackgroundMaterial> = null;
    _skyBox: Nullable<Mesh> = null;

    async #initEnv() {
        debug(this, "initializing env", { src: this.src });
        const scene = this.scene;
        this._envTxt = await MyEnvironElem._loadTextureAsync(scene, this.src!);
        this._envTxt.level = this.envIntens;
        scene.environmentTexture = this._envTxt;
    }

    async #initSky() {
        debug(this, "initializing sky", { src: this.src });
        const scene = this.scene;

        this._skyTxt = this._envTxt!.clone();
        this._skyTxt.coordinatesMode = Texture.SKYBOX_MODE;
        this._skyTxt.level = this.skyIntens
        
        this._skyMat = new BackgroundMaterial("(SkyBox)", scene);
        this._skyMat.backFaceCulling = false;
        this._skyMat.reflectionTexture = this._skyTxt;
        this._skyMat.reflectionBlur = this.skyBlur;

        this._skyBox = CreateBox("(SkyBox)", { size: this.size, sideOrientation: Mesh.BACKSIDE }, scene);
        Tags.AddTagsTo(this._skyBox, "aux");
        this._skyBox.isPickable = false;
        this._skyBox.material = this._skyMat;
        this._skyBox.infiniteDistance = true;
        this._skyBox.ignoreCameraMaxZ = true;
    }

    override update(changes: PropertyValues) {
        if (this.hasUpdated && changes.has("src")) throw Error("not supported");
        if (this.hasUpdated && changes.has("size")) throw Error("not supported");
        if (changes.has("envIntens") && this._envTxt) this._envTxt.level = this.envIntens;
        if (changes.has("skyIntens") && this._skyTxt) this._skyTxt.level = this.skyIntens;
        if (changes.has("skyBlur") && this._skyMat) this._skyMat.reflectionBlur = this.skyBlur;
        super.update(changes);
    }
}
