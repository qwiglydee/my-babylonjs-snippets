import { provide } from "@lit/context";
import { css, ReactiveElement, type PropertyValues } from "lit";
import { customElement, property, state } from "lit/decorators.js";

import { PointerDragBehavior } from "@babylonjs/core/Behaviors/Meshes/pointerDragBehavior";
import type { Camera } from "@babylonjs/core/Cameras/camera";
import type { PickingInfo } from "@babylonjs/core/Collisions/pickingInfo";
import { AxesViewer } from "@babylonjs/core/Debug/axesViewer";
import { Engine } from "@babylonjs/core/Engines/engine";
import type { EngineOptions } from "@babylonjs/core/Engines/thinEngine";
import { PointerEventTypes, PointerInfo } from "@babylonjs/core/Events/pointerEvents";
import { Color3, Color4, Vector3 } from "@babylonjs/core/Maths";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { Tags } from "@babylonjs/core/Misc/tags";
import { UtilityLayerRenderer } from "@babylonjs/core/Rendering/utilityLayerRenderer";
import type { Nullable } from "@babylonjs/core/types";
import { HighlightLayer } from "@babylonjs/core/Layers/highlightLayer";
import "@babylonjs/core/Layers/effectLayerSceneComponent";

import { babylonCtx, pickCtx, utilsCtx, type BabylonCtx, type PickDetail } from "./context";
import { assertNonNull } from "./utils/asserts";
import { debug } from "./utils/debug";
import { bubbleEvent } from "./utils/events";
import { MyScene } from "./scene";

const ENGOPTIONS: EngineOptions = {
    antialias: true,
    stencil: true,
    doNotHandleContextLost: true,
};

/**
 * Babylon-aware component and context
 */
@customElement("my-babylon")
export class MyBabylonElem extends ReactiveElement {
    @provide({ context: babylonCtx })
    ctx: Nullable<BabylonCtx> = null; // updated when changed and got ready 

    @provide({ context: utilsCtx })
    utils!: UtilityLayerRenderer; // available right after dom connection, const

    @provide({ context: pickCtx })
    pick: Nullable<PickingInfo> = null;

    @property({ type: Boolean })
    rightHanded = false;

    @property({ type: Number })
    worldSize = 100;

    @property({ type: Boolean })
    picking = false;

    @property({ type: Boolean })
    dragging = false;

    @property({ type: Boolean })
    highlighting = false;

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

    scene!: MyScene;

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
                if (entries[0].isIntersecting) this.#startRendering();
                else this.#stopRendering();
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
        if (!this.scene.activeCamera) return;
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

    #init() {
        debug(this, "initializing");
        this.engine = new Engine(this.canvas, undefined, ENGOPTIONS);
        this.scene = new MyScene(this.engine);
        this.scene.useRightHandedSystem = this.rightHanded;
        this.scene.clearColor = Color4.FromHexString(getComputedStyle(this).getPropertyValue("--my-background-color"));
        this.utils = UtilityLayerRenderer.DefaultUtilityLayer;

        this.scene.getNodes().forEach((n) => Tags.AddTagsTo(n, "default"));

        if (this.picking) this.#initPicking();
        if (this.dragging) this.#initDragging();
        if (this.highlighting) this.#initHighlighting();

        new AxesViewer(this.utils.utilityLayerScene);

        this.scene.onModelUpdatedObservable.add(() => this.#invalidateCtx());
        this.#refreshCtx();
    }

    #initPicking() {
        this.scene.onPointerObservable.add((info: PointerInfo) => {
            if (info.type == PointerEventTypes.POINTERTAP) {
                if (info.pickInfo?.pickedMesh) this.onpick(info.pickInfo);
                else this.unpick();
            }
        });
    }

    _dragBhv: Nullable<PointerDragBehavior> = null;
    #initDragging() {
        this._dragBhv = new PointerDragBehavior({ dragPlaneNormal: Vector3.Up() });
        this._dragBhv.onDragStartObservable.add(() => this.ongrabbed(this._dragBhv!.attachedNode as Mesh));
        this._dragBhv.onDragEndObservable.add(() => this.ondropped(this._dragBhv!.attachedNode as Mesh));
    }


    _highlighter: Nullable<HighlightLayer> = null; 
    _highloghtColor = Color3.Yellow();
    
    #initHighlighting() {
        this._highlighter = new HighlightLayer("highlight", this.scene);
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
        this.ctx = {
            worldSize: this.worldSize,
            scene: this.scene,
            bounds: this.scene.getModelExtends(),
        };
        this._ctx_dirty = false;
        debug(this, `CTX ==`, this.ctx);
        bubbleEvent(this, "babylon.updated", {});
    }


    #select(mesh: Mesh) {
        if (this._dragBhv) this._dragBhv.attach(mesh);
        if (this._highlighter) this._highlighter.addMesh(mesh, this._highloghtColor);
    } 

    #deselect(mesh: Mesh) {
        if (this._dragBhv) this._dragBhv.detach();
        if (this._highlighter) this._highlighter.removeMesh(mesh);
    }

    _selected: Nullable<Mesh> = null;

    onpick(pickinfo: PickingInfo) {
        this.pick = pickinfo;
        if (this._selected === this.pick.pickedMesh) return;
        assertNonNull(this.pick.pickedMesh);
             
        if (this._selected) this.#deselect(this._selected);
        this._selected = this.pick.pickedMesh as Mesh; 
        this.#select(this._selected);

        bubbleEvent<PickDetail>(this, "babylon.picked", { state: "picked", mesh: this._selected.id });
    }

    unpick() {
        if (this._selected) this.#deselect(this._selected);
        this._selected = null;
        this.pick = null;
        bubbleEvent<PickDetail>(this, "babylon.picked", { mesh: null });
    }

    ongrabbed(mesh: Mesh) {
        assertNonNull(mesh);
        bubbleEvent<PickDetail>(this, "babylon.grabbed", { state: "dragging", mesh: mesh.id });
    }

    ondropped(mesh: Mesh) {
        assertNonNull(mesh);
        bubbleEvent<PickDetail>(this, "babylon.dropped", { state: "dropped", mesh: mesh.id });
        if (mesh === this._selected) this.unpick();
    }
}
