import { css, ReactiveElement, type PropertyValues } from "lit";
import { customElement, property } from "lit/decorators.js";
import { provide } from "@lit/context";

import { Color4, Vector3 } from "@babylonjs/core/Maths";
import { Engine } from "@babylonjs/core/Engines/engine";
import { Scene, type SceneOptions } from "@babylonjs/core/scene";
import { UtilityLayerRenderer } from "@babylonjs/core/Rendering/utilityLayerRenderer";
import type { EngineOptions } from "@babylonjs/core/Engines/thinEngine";
import "@babylonjs/core/Helpers/sceneHelpers";
import { ArcRotateCamera } from "@babylonjs/core/Cameras/arcRotateCamera";

import type { Camera } from "@babylonjs/core/Cameras/camera";
import type { Nullable } from "@babylonjs/core/types";

import { type BabylonCtx, babylonCtx } from "./context";

const ENGOPTIONS: EngineOptions = {
    antialias: true,
    stencil: false,
    doNotHandleContextLost: true,
}

const SCNOPTIONS: SceneOptions = {
}

/**
 * Babylon-aware component and context
 */
@customElement("my-babylon")
export class MyBabylonElem extends ReactiveElement {
    @provide({ context: babylonCtx })
    ctx: Nullable<BabylonCtx> = null;

    @property({ type: Number})
    worldSize = 100;

    @property({ type: Boolean})
    defaultEnv = false;

    @property({ type: Boolean})
    defaultLight = false;

    @property({ type: Boolean})
    defaultGround = false;

    @property({ type: Boolean})
    defaultCamera = false;

    static override styles = css`
        :host {
            display: block;
            background-color: var(--my-background-color, #808080);
        } 

        canvas {
            width: 100%;
            height: 100%;
        }
    `

    canvas: HTMLCanvasElement;
    engine!: Engine;

    scene!: Scene;
    camera: Nullable<Camera> = null;
    utils!: UtilityLayerRenderer;

    #needresize = true;
    #resizingObs!: ResizeObserver;
    #visibilityObs!: IntersectionObserver;

    constructor() {
        super();
        this.canvas = this.ownerDocument.createElement('canvas');
        this.#resizingObs = new ResizeObserver(
            () => { this.#needresize = true; }
        );
        this.#visibilityObs = new IntersectionObserver(
            (entries) => {
                const visible = entries[0].isIntersecting; 
                if (visible) this.engine.runRenderLoop(this.#render); else this.engine.stopRenderLoop(this.#render);
            },
            { threshold: 0.5 }
        );
    }

    #render = () => {
        if (this.#needresize) { this.engine.resize(); this.#needresize = false; }
        this.scene.render();
    }

    override connectedCallback(): void {
        super.connectedCallback();
        this.renderRoot.appendChild(this.canvas);
        this.#init();
        this.#resizingObs.observe(this);
        this.#visibilityObs.observe(this);
    }

    override disconnectedCallback(): void {
        this.#resizingObs.disconnect();
        this.#visibilityObs.disconnect();
        this.#dispose();
        this.renderRoot.removeChild(this.canvas);
        super.disconnectedCallback();
    }

    async #init() {
        this.engine = new Engine(this.canvas, undefined, ENGOPTIONS);
        this.scene = new Scene(this.engine, SCNOPTIONS);
        this.scene.clearColor = Color4.FromHexString(getComputedStyle(this).getPropertyValue('--my-background-color'));
        this.utils = UtilityLayerRenderer.DefaultUtilityLayer;

        if (this.defaultEnv) this.scene.createDefaultEnvironment({ skyboxSize: this.worldSize, createGround: this.defaultGround, groundSize: this.worldSize });
        if (this.defaultLight) this.scene.createDefaultLight(true);
        if (this.defaultCamera) {
            let camera = new ArcRotateCamera("DefaultCamera", 0.25 * Math.PI, 0.25 * Math.PI, this.worldSize * 0.5, Vector3.Zero(), this.scene, true);
            camera.lowerRadiusLimit = 1;
            camera.upperRadiusLimit = 0.5 * this.worldSize;
            camera.maxZ = 10000;
            camera.minZ = 0.001;
            camera.attachControl();
            camera.useAutoRotationBehavior = true;
        }
    
        this.camera = this.scene.activeCamera;

        await this.scene.whenReadyAsync(true);

        this.ctx = {
            size: this.worldSize,
            scene: this.scene,
            utils: this.utils,
            camera: this.camera,
        }
    }

    #dispose() {
        this.scene.dispose();
        this.engine.dispose();
    }
}