import { provide } from "@lit/context";
import { css, ReactiveElement, type PropertyValues } from "lit";
import { customElement, property, state } from "lit/decorators.js";

import { PointerDragBehavior } from "@babylonjs/core/Behaviors/Meshes/pointerDragBehavior";
import type { PickingInfo } from "@babylonjs/core/Collisions/pickingInfo";
import { AxesViewer } from "@babylonjs/core/Debug/axesViewer";
import { Engine } from "@babylonjs/core/Engines/engine";
import type { EngineOptions } from "@babylonjs/core/Engines/thinEngine";
import { PointerEventTypes, PointerInfo } from "@babylonjs/core/Events/pointerEvents";
import { Color3, Color4, Vector3 } from "@babylonjs/core/Maths";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { Tags } from "@babylonjs/core/Misc/tags";
import { UtilityLayerRenderer } from "@babylonjs/core/Rendering/utilityLayerRenderer";
import { Scene, type SceneOptions } from "@babylonjs/core/scene";
import type { Nullable } from "@babylonjs/core/types";

import "@babylonjs/core/Rendering/outlineRenderer";

import { babylonCtx, type BabylonCtx, type PickDetail } from "./context";
import { assert } from "./utils/asserts";
import { debug } from "./utils/debug";
import { bubbleEvent } from "./utils/events";
import type { Camera } from "@babylonjs/core/Cameras/camera";

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

    @property({ type: Boolean })
    rightHanded = false;

    @property({ type: Number })
    worldSize = 100;

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
                if (entries[0].isIntersecting) this.#startRendering(); else this.#stopRendering();
            },
            { threshold: 0.5 }
        );
    }

    __camera_bak: Nullable<Camera> = null;

    #startRendering() {
        if (this.__camera_bak) {
            this.scene.activeCamera = this.__camera_bak;
            this.scene.activeCamera?.attachControl();
        }
        this.engine.runRenderLoop(this.#rendering);
    }

    #stopRendering() {
        this.engine.stopRenderLoop(this.#rendering);
        if (this.scene.activeCamera) {
            this.scene.activeCamera?.detachControl();
            this.__camera_bak = this.scene.activeCamera;
            this.scene.activeCamera = null;
        }
    }

    #rendering = () => {
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

    getModel() {
        return this.scene.getMeshesByTags("!scenery");
    }

    #init() {
        debug(this, "initializing");
        this.engine = new Engine(this.canvas, undefined, ENGOPTIONS);
        this.scene = new Scene(this.engine, SCNOPTIONS);
        this.scene.useRightHandedSystem = this.rightHanded;
        this.scene.clearColor = Color4.FromHexString(getComputedStyle(this).getPropertyValue("--my-background-color"));
        this.utils = UtilityLayerRenderer.DefaultUtilityLayer;

        this.scene.getNodes().forEach((n) => Tags.AddTagsTo(n, "default"));

        if (this.picking) {
            this.scene.onPointerObservable.add((info: PointerInfo) => {
                if (info.type == PointerEventTypes.POINTERTAP) {
                    if (info.pickInfo?.pickedMesh) this.onpick(info.pickInfo);
                    else this.unpick();
                }
            });

            if (this.dragging) {
                this.#dragBeh = new PointerDragBehavior({ dragPlaneNormal: Vector3.Up() });
                this.#dragBeh.dragDeltaRatio = 0.2;

                this.#dragBeh.onDragStartObservable.add(() => {
                    this.ongrabbed(this.#dragBeh!.attachedNode as Mesh);
                });
                this.#dragBeh.onDragEndObservable.add(() => {
                    this.ondropped(this.#dragBeh!.attachedNode as Mesh);
                });
            }
        }

        new AxesViewer(this.utils.utilityLayerScene);

        // delay updating untill next event loop cycle
        this.scene.onNewMeshAddedObservable.add(() => this.#invalidateCtx());
        this.scene.onMeshRemovedObservable.add(() => this.#invalidateCtx());
        this.#refreshCtx();
    }

    #dispose() {
        this.scene.dispose();
        this.engine.dispose();
    }

    override update(changes: PropertyValues) {
        if (changes.has("_ctx_dirty")) this.#refreshCtx();
        super.update(changes);
    }

    @state()
    _ctx_dirty = true;

    #invalidateCtx() {
        this._ctx_dirty = true;
    }

    /** this notifies all plugged in subscribers */
    async #refreshCtx() {
        if (!this._ctx_dirty) return;
        await this.scene.whenReadyAsync(true);
        const models = this.getModel();
        this.ctx = {
            size: this.worldSize,
            scene: this.scene,
            utils: this.utils,
            bounds: Mesh.MinMax(models),
            count: models.length,
        };
        this._ctx_dirty = false;
        debug(this, `CTX == (${this.ctx.count})`, this.ctx);
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
