import { provide } from "@lit/context";
import { css, ReactiveElement } from "lit";
import { customElement, property } from "lit/decorators.js";

import { ArcRotateCamera } from "@babylonjs/core/Cameras/arcRotateCamera";
import type { Camera } from "@babylonjs/core/Cameras/camera";
import type { PickingInfo } from "@babylonjs/core/Collisions/pickingInfo";
import { Engine } from "@babylonjs/core/Engines/engine";
import type { EngineOptions } from "@babylonjs/core/Engines/thinEngine";
import { PointerEventTypes, PointerInfo } from "@babylonjs/core/Events/pointerEvents";
import "@babylonjs/core/Helpers/sceneHelpers";
import { Color3, Color4, Vector3 } from "@babylonjs/core/Maths";
import type { Mesh } from "@babylonjs/core/Meshes/mesh";
import "@babylonjs/core/Rendering/outlineRenderer";
import { UtilityLayerRenderer } from "@babylonjs/core/Rendering/utilityLayerRenderer";
import { Scene, type SceneOptions } from "@babylonjs/core/scene";
import type { Nullable } from "@babylonjs/core/types";
import { PointerDragBehavior } from "@babylonjs/core/Behaviors/Meshes/pointerDragBehavior";

import { type BabylonCtx, babylonCtx, type PickDetail } from "./context";
import { debug } from "./utils/debug";
import { bubbleEvent } from "./utils/events";
import { assert } from "./utils/asserts";

const ENGOPTIONS: EngineOptions = {
    antialias: true,
    stencil: false,
    doNotHandleContextLost: true,
};

const SCNOPTIONS: SceneOptions = {};

/**
 * Babylon-aware component and context
 */
@customElement("my-babylon")
export class MyBabylonElem extends ReactiveElement {
    @provide({ context: babylonCtx })
    ctx: Nullable<BabylonCtx> = null;

    @property({ type: Number })
    worldSize = 100;

    @property({ type: Boolean })
    defaultEnv = false;

    @property({ type: Boolean })
    defaultLight = false;

    @property({ type: Boolean })
    defaultGround = false;

    @property({ type: Boolean })
    defaultCamera = false;

    @property({ type: Boolean })
    picking = false;

    @property({ type: Boolean })
    dragging = false;

    static override styles = css`
        :host {
            display: block;
            background-color: var(--my-background-color, #808080);
        }

        canvas {
            width: 100%;
            height: 100%;
        }
    `;

    canvas: HTMLCanvasElement;
    engine!: Engine;

    scene!: Scene;
    camera: Nullable<Camera> = null;
    utils!: UtilityLayerRenderer;

    #dragBeh: Nullable<PointerDragBehavior> = null;

    #needresize = true;
    #resizingObs!: ResizeObserver;
    #visibilityObs!: IntersectionObserver;

    constructor() {
        super();
        this.canvas = this.ownerDocument.createElement("canvas");
        this.#resizingObs = new ResizeObserver(() => {
            this.#needresize = true;
        });
        this.#visibilityObs = new IntersectionObserver(
            (entries) => {
                const visible = entries[0].isIntersecting;
                if (visible) this.engine.runRenderLoop(this.#render);
                else this.engine.stopRenderLoop(this.#render);
            },
            { threshold: 0.5 }
        );
    }

    #render = () => {
        if (this.#needresize) {
            this.engine.resize();
            this.#needresize = false;
        }
        this.scene.render();
    };

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
        this.scene.clearColor = Color4.FromHexString(getComputedStyle(this).getPropertyValue("--my-background-color"));
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

        if (this.picking) {
            this.scene.onPointerObservable.add((info: PointerInfo) => {
                if (info.type == PointerEventTypes.POINTERTAP) {
                    if (info.pickInfo?.pickedMesh) this.onpick(info.pickInfo); else this.unpick();
                }
            });
    
            if (this.dragging) {
                this.#dragBeh = new PointerDragBehavior({ dragPlaneNormal: Vector3.Up()});
                this.#dragBeh.dragDeltaRatio = 0.2;

                this.#dragBeh.onDragStartObservable.add(() => {
                    this.ongrabbed(this.#dragBeh!.attachedNode as Mesh);
                })
                this.#dragBeh.onDragEndObservable.add(() => {
                    this.ondropped(this.#dragBeh!.attachedNode as Mesh);
                })
            }
        }


        await this.scene.whenReadyAsync(true);

        this.ctx = {
            size: this.worldSize,
            scene: this.scene,
            utils: this.utils,
            camera: this.camera,
        };
    }

    #dispose() {
        this.scene.dispose();
        this.engine.dispose();
    }

    _picked: Nullable<Mesh> = null;

    #unpick() {
        if (this._picked) this._picked.renderOutline = false;
        if (this.#dragBeh) this.#dragBeh.detach();
        this._picked = null;
    }

    onpick(pickinfo: PickingInfo | null) {
        assert(pickinfo && pickinfo.pickedMesh);
        this.#unpick();
        this._picked = pickinfo.pickedMesh as Mesh;
        this._picked.renderOutline = true;
        this._picked.outlineColor = Color3.Yellow();
        this._picked.outlineWidth = 0.05;

        if (this.#dragBeh) this.#dragBeh.attach(this._picked);
        debug(this, "picked", { mesh: this._picked, point: pickinfo.pickedPoint });
        bubbleEvent<PickDetail>(this, "babylon.picked", { state: "picked", mesh: this._picked.name });
    }

    unpick() {
        debug(this, "unpicked", { mesh: this._picked });
        this.#unpick();
        bubbleEvent<PickDetail>(this, "babylon.picked", { mesh: null });
    }

    ongrabbed(mesh: Mesh) {
        debug(this, "grabbed", { mesh });
        bubbleEvent<PickDetail>(this, "babylon.picked", { state: "dragging", mesh: mesh.name });
    }

    ondropped(mesh: Mesh) {
        debug(this, "dropped", { mesh });
        this.#unpick();
        bubbleEvent<PickDetail>(this, "babylon.picked", { mesh: null });
    }
}
