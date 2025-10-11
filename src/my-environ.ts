import { consume } from "@lit/context";
import { ReactiveElement, type PropertyValues } from "lit";
import { customElement, property } from "lit/decorators.js";

import "@babylonjs/core/Helpers/sceneHelpers";
import { BackgroundMaterial } from "@babylonjs/core/Materials/Background/backgroundMaterial";
import { CubeTexture } from "@babylonjs/core/Materials/Textures/cubeTexture";
import { Texture } from "@babylonjs/core/Materials/Textures/texture";
import { CreateBox } from "@babylonjs/core/Meshes/Builders/boxBuilder";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import type { Nullable } from "@babylonjs/core/types";

import { babylonCtx, type BabylonCtx } from "./context";

const DEFAULT_ENV = new URL("./assets/studio.env?inline", import.meta.url);

@customElement("my-environ")
export class MyEnvironElem extends ReactiveElement {
    @consume({ context: babylonCtx, subscribe: true })
    ctx: Nullable<BabylonCtx> = null;

    @property()
    src: Nullable<string> = null;

    @property({ type: Number })
    envIntens = 1.0;

    @property({ type: Boolean })
    sky = false;

    @property({ type: Number })
    skyIntens = 0.5;

    @property({ type: Number })
    skyBlur = 0.5;

    protected override shouldUpdate(_changes: PropertyValues): boolean {
        return this.ctx != null;
    }

    override update(changes: PropertyValues) {
        if (!this.hasUpdated) this.#create();
        else {
            if (changes.has("envIntens") && this._envTxt) this._envTxt.level = this.envIntens;
            if (changes.has("skyIntens") && this._skyTxt) this._skyTxt.level = this.skyIntens;
            if (changes.has("skyBlur") && this._skyMat) this._skyMat.reflectionBlur = this.skyBlur;
        }
        // TODO: reloading textures on the fly maybe
        super.update(changes);
    }

    _envTxt: Nullable<CubeTexture> = null;
    _skyTxt: Nullable<CubeTexture> = null;
    _skyMat: Nullable<BackgroundMaterial> = null;
    _skyBox: Nullable<Mesh> = null;

    #create() {
        this.#createEnv();
        if (this.sky) this.#createSky();
    }

    #createEnv() {
        const scene = this.ctx!.scene;
        
        if (this.src) {
            this._envTxt = new CubeTexture(this.src, scene);
        } else {
            this._envTxt = new CubeTexture(DEFAULT_ENV.href, scene, { forcedExtension: ".env" });
        }
        this._envTxt.level = this.envIntens;
        scene.environmentTexture = this._envTxt;
    }

    #createSky() {
        const scene = this.ctx!.scene;

        this._skyTxt = this._envTxt!.clone();
        this._skyTxt.level = this.skyIntens;
        this._skyTxt.coordinatesMode = Texture.SKYBOX_MODE;

        this._skyMat = new BackgroundMaterial("(SkyBox)", scene);
        this._skyMat.backFaceCulling = false;
        this._skyMat.reflectionTexture = this._skyTxt;
        this._skyMat.reflectionBlur = this.skyBlur;

        this._skyBox = CreateBox("(SkyBox)", { size: this.ctx!.size, sideOrientation: Mesh.BACKSIDE }, scene);
        this._skyBox.isPickable = false;
        this._skyBox.material = this._skyMat;
        this._skyBox.infiniteDistance = true;
        this._skyBox.ignoreCameraMaxZ = true;

        scene.markAux(this._skyBox);
    }
}
