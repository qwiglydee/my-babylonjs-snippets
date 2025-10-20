import { provide } from "@lit/context";
import { css, html, ReactiveElement, render, type PropertyValues } from "lit";
import { customElement, property, query, state } from "lit/decorators.js";

import type { PickingInfo } from "@babylonjs/core/Collisions/pickingInfo";
import { AxesViewer } from "@babylonjs/core/Debug/axesViewer";
import { Engine } from "@babylonjs/core/Engines/engine";
import type { EngineOptions } from "@babylonjs/core/Engines/thinEngine";
import "@babylonjs/core/Layers/effectLayerSceneComponent";
import { Color4 } from "@babylonjs/core/Maths";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { UtilityLayerRenderer } from "@babylonjs/core/Rendering/utilityLayerRenderer";
import type { Scene } from "@babylonjs/core/scene";
import type { Nullable } from "@babylonjs/core/types";
import { HighlightingController } from "./behaviors/highlighting";
import { PickingController } from "./behaviors/picking";
import { ShufflingController } from "./behaviors/shuffling";
import { pickCtx, sceneCtx, utilsCtx, type PickDetail, type SceneCtx } from "./context";
import { MyScene } from "./scene";
import { assertNonNull } from "./utils/asserts";
import { debug } from "./utils/debug";
import { queueEvent } from "./utils/events";
import { MovingController } from "./behaviors/moving";

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
    /** available immediately, updating when scene content changes */
    @provide({ context: sceneCtx })
    ctx!: SceneCtx;

    /** utility layer scene */
    @provide({ context: utilsCtx })
    utils!: Scene;

    @provide({ context: pickCtx })
    @state()  // updated by behaviors
    pick: Nullable<PickingInfo> = null;

    @property({ type: Boolean })
    rightHanded = false;
    
    static override styles = css`
        :host {
            display: block;
            position: relative;
            background-color: var(--my-background-color, #808080);
        }

        canvas {
            position: absolute;
            display: block;
            width: 100%;
            height: 100%;
            z-index: 0;
        }


        slot[name="overlay"] {
            position: absolute;
            display: block;
            width: 100%;
            height: 100%;
            z-index: 1;
            pointer-events: none;
        }
    `;

    /* single-shot rendering, not updating */
    #renderHTML() {
        render(
            html`
                <canvas></canvas>
                <slot name="overlay" class="overlay"></slot>
            `,
            this.renderRoot
        );
    }

    @query('canvas')
    canvas!: HTMLCanvasElement;

    engine!: Engine;
    scene!: MyScene;

    @state()
    selected: Nullable<Mesh> = null;

    #needresize = true;
    #resizingObs!: ResizeObserver;
    #visibilityObs!: IntersectionObserver;

    constructor() {
        super();
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

    @property({ type: Boolean })
    set picking(enable: boolean) {
        if (enable) {
            this._pickingCtrl = new PickingController(this);
            this.addController(this._pickingCtrl);
        } else if (this._pickingCtrl) {
            this.removeController(this._pickingCtrl);
            this._pickingCtrl.dispose();
            this._pickingCtrl = null;
        }
    }
    _pickingCtrl: Nullable<PickingController> = null;

    @property({ type: Boolean })
    set moving(enable: boolean) {
        if (enable) {
            this._movingCtrl = new MovingController(this);
            this.addController(this._movingCtrl);
        } else if (this._movingCtrl) {
            this.removeController(this._movingCtrl);
            this._movingCtrl.dispose();
            this._movingCtrl = null;
        }
    }
    _movingCtrl: Nullable<MovingController> = null;

    @property({ type: Boolean })
    set highlighting(enable: boolean) {
        if (enable) {
            this._highlightingCtrl = new HighlightingController(this);
            this.addController(this._highlightingCtrl);
        } else if (this._highlightingCtrl) {
            this.removeController(this._highlightingCtrl);
            this._highlightingCtrl.dispose();
            this._highlightingCtrl = null;
        }
    }
    _highlightingCtrl: Nullable<HighlightingController> = null;

    @property({ type: Boolean })
    set shuffling(enable: boolean) {
        if (enable) {
            this._shufflingCtrl = new ShufflingController(this);
            this.addController(this._shufflingCtrl);
        } else if (this._shufflingCtrl) {
            this.removeController(this._shufflingCtrl);
            this._shufflingCtrl.dispose();
            this._shufflingCtrl = null;
        }
    }
    _shufflingCtrl: Nullable<ShufflingController> = null;


    #startRendering() {
        this.scene.activeCamera?.setEnabled(true);
        this.engine.runRenderLoop(this.#rendering);
    }

    #stopRendering() {
        this.engine.stopRenderLoop(this.#rendering);
        this.scene.activeCamera?.setEnabled(false);
    }

    #rendering = () => {
        if (this.#needresize) {
            this.engine.resize();
            this.#needresize = false;
        }
        if (this.scene.activeCamera) {
            this.scene.render();
        }
    };

    @state()
    _ctx_dirty = true;

    #invalidateCtx() {
        debug(this, 'CTX');
        this._ctx_dirty = true;
    }

    async #refreshCtx() {
        if (!this._ctx_dirty) return;
        await this.scene.whenReadyAsync(true);
        this.ctx = {
            scene: this.scene,
            world: this.scene.getWorldBounds(),
            bounds: this.scene.getModelBounds(),
        };
        this._ctx_dirty = false;
        debug(this, `CTX ===`, this.ctx);
        queueEvent(this, "babylon.updated", {});
    }

    override connectedCallback(): void {
        super.connectedCallback();
        this.#renderHTML();
        this.#init();
        this.scene.onModelUpdatedObservable.add(() => this.#invalidateCtx());
        this.#resizingObs.observe(this);
        this.#visibilityObs.observe(this);
        // NB: initial scene is not ready yet but it's empty anyway
        this.ctx = {
            scene: this.scene,
            world: null,
            bounds: null,
        }
    }

    override disconnectedCallback(): void {
        this.#resizingObs.disconnect();
        this.#visibilityObs.disconnect();
        this.#dispose();
        super.disconnectedCallback();
    }

    #init() {
        debug(this, "initializing");
        this.engine = new Engine(this.canvas, undefined, ENGOPTIONS);
        this.scene = new MyScene(this.engine);
        this.scene.useRightHandedSystem = this.rightHanded;
        this.scene.clearColor = Color4.FromHexString(getComputedStyle(this).getPropertyValue("--my-background-color"));
        this.utils = new UtilityLayerRenderer(this.scene, false, false).utilityLayerScene;
        new AxesViewer(this.utils);
    }


    // dragBhv!: PointerDragBehavior;
    // dragDist = 0;
    // #initDragging() {
    //     this.dragBhv = new PointerDragBehavior({ dragPlaneNormal: Vector3.Up() });
    //     this.dragBhv.onDragStartObservable.add(() => {
    //         debug(this, "drag started", this.dragDist);
    //         this.dragDist = 0;
    //     });
    //     this.dragBhv.onDragObservable.add((data: {dragDistance: number}) => {
    //         this.dragDist += data.dragDistance;
    //         debug(this, "dragging", this.dragDist);
    //     });
    //     this.dragBhv.onDragEndObservable.add(() => {
    //         debug(this, "drag ended", this.dragDist);
    //         if (this.dragDist > 0) {
    //             this.scene.onModelUpdatedObservable.notifyObservers([this.dragBhv.attachedNode]);
    //         }
    //         this.selected = null;
    //         // this.requestUpdate();
    //     });
    // }

    #dispose() {
        this.scene.dispose();
        this.engine.dispose();
    }

    override update(changes: PropertyValues) {
        if (changes.has("_ctx_dirty") && this._ctx_dirty) this.#refreshCtx();
        super.update(changes);
    }

    override updated(changes: PropertyValues) {
        // set/reset by picking ctrl or dragging ctrl
        if (changes.has("pick")) {
            queueEvent<PickDetail>(this, "babylon.picked", { state: "picked", mesh: this.pick?.pickedMesh?.id});
        }
    }
}
