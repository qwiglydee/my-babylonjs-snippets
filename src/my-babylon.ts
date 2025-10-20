import { provide } from "@lit/context";
import { css, html, ReactiveElement, render, type PropertyValues } from "lit";
import { customElement, property, query, standardProperty, state } from "lit/decorators.js";

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

import { BabylonController, type BabylonExtendedElem } from "./behaviors/base";
import { HighlightingController } from "./behaviors/highlighting";
import { MovingController } from "./behaviors/moving";
import { PickingController } from "./behaviors/picking";
import { ShufflingController } from "./behaviors/shuffling";
import { pickCtx, sceneCtx, utilsCtx, type BabylonElem, type PickDetail, type SceneCtx } from "./context";
import { MyScene } from "./scene";
import { debug, debugChanges } from "./utils/debug";
import { queueEvent } from "./utils/events";

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
    @state() // updated by behaviors
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

    @query("canvas")
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

    // permanent controller
    _pickingCtrl = new PickingController(this);

    @property({ type: Boolean })
    moving = false;
    _movingCtrl: Nullable<MovingController> = null;

    @property({ type: Boolean })
    highlighting = false;
    _highlightingCtrl: Nullable<HighlightingController> = null;

    @property({ type: Boolean })
    shuffling = false;
    _shufflingCtrl: Nullable<ShufflingController> = null;

    /** setting up controllers dynamically from property changes  */
    _toggleCtrl<T extends BabylonController>(ctrl: Nullable<T>,  enable: boolean, Constructor: new (elem: BabylonElem) => T): Nullable<T> {
        debug(this, "toggling", { ctrl: Constructor.name, enable });
        if (enable) {
            ctrl = new Constructor(this);
            this.addController(ctrl);
        } else {
            if (ctrl) this.removeController(ctrl);
            ctrl = null;
        }
        return ctrl;
    }
    
    override addController(ctrl: BabylonController) {
        super.addController(ctrl);
        if (this.hasUpdated) ctrl.init();
    }

    override removeController(ctrl: BabylonController) {
        ctrl.dispose?.();
        super.removeController(ctrl);
    }

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
        debug(this, "CTX");
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
        this.addController(this._pickingCtrl);
        this.scene.onModelUpdatedObservable.add(() => this.#invalidateCtx());
        this.#resizingObs.observe(this);
        this.#visibilityObs.observe(this);
        // NB: initial scene is not ready yet but it's empty anyway
        this.ctx = {
            scene: this.scene,
            world: null,
            bounds: null,
        };
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

    #dispose() {
        this.scene.dispose();
        this.engine.dispose();
    }

    override update(changes: PropertyValues) {
        if (changes.has("highlighting")) this._highlightingCtrl = this._toggleCtrl(this._highlightingCtrl, this.highlighting, HighlightingController);
        if (changes.has("moving")) this._movingCtrl = this._toggleCtrl(this._movingCtrl, this.moving, MovingController);
        if (changes.has("shuffling")) this._shufflingCtrl = this._toggleCtrl(this._shufflingCtrl, this.shuffling, ShufflingController);
        if (changes.has("_ctx_dirty") && this._ctx_dirty) this.#refreshCtx();
        super.update(changes);
    }

    override updated(changes: PropertyValues) {
        if (changes.has("pick")) {
            queueEvent<PickDetail>(this, "babylon.picked", { state: "picked", mesh: this.pick?.pickedMesh?.id });
        }
    }
}
