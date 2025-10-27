import { provide } from "@lit/context";
import { css, html, ReactiveElement, render, type PropertyValues } from "lit";
import { customElement, property, query, state } from "lit/decorators.js";

import type { PickingInfo } from "@babylonjs/core/Collisions/pickingInfo";
import { Engine } from "@babylonjs/core/Engines/engine";
import type { EngineOptions } from "@babylonjs/core/Engines/thinEngine";
import { Color4 } from "@babylonjs/core/Maths";
import type { Nullable } from "@babylonjs/core/types";

import { modelCtx, pickCtx, sceneCtx, type BabylonElem, type ModelCtx, type PickDetail } from "./context";
import { BabylonController } from "./controllers/base";
import { MovingController } from "./controllers/moving";
import { PickingController } from "./controllers/picking";
import { ShufflingController } from "./controllers/shuffling";
import { MyScene } from "./scene";
import { debug } from "./utils/debug";
import { queueEvent } from "./utils/events";
import { KillingController } from "./controllers/killing";

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
    @query("canvas")
    canvas!: HTMLCanvasElement;

    engine!: Engine;

    @provide({ context: sceneCtx })
    scene!: MyScene;

    @provide({ context: modelCtx })
    model!: ModelCtx;

    @provide({ context: pickCtx })
    @state() // updated by behaviors
    pick: Nullable<PickingInfo> = null;

    @property({ type: Boolean })
    rightHanded = false;

    @property({ type: Boolean })
    moving = false;

    @property({ type: Boolean })
    highlighting = false;

    @property({ type: Boolean })
    shuffling = false;

    @property({ type: Boolean })
    killing = false;

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
        this.model = {
            scene: this.scene,
            world: this.scene.getWorldBounds(),
            bounds: this.scene.getModelBounds(),
        };
        this._ctx_dirty = false;
        debug(this, `CTX ===`, this.model);
        queueEvent(this, "babylon.updated", {});
    }

    _pickingCtrl = new PickingController(this);

    _movingCtrl: Nullable<MovingController> = null;

    _shufflingCtrl: Nullable<ShufflingController> = null;

    _killingCtrl: Nullable<KillingController> = null;

    /** setting up controllers dynamically from property changes  */
    _toggleCtrl<T extends BabylonController>(ctrl: Nullable<T>, enable: boolean, Constructor: new (elem: BabylonElem) => T): Nullable<T> {
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

    override connectedCallback(): void {
        super.connectedCallback();
        this.#renderHTML();
        this.#init();
        this.addController(this._pickingCtrl);
        this.scene.onModelUpdatedObservable.add(() => this.#invalidateCtx());
        this.#resizingObs.observe(this);
        this.#visibilityObs.observe(this);
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

        // initial context should be available to all components
        this.model = {
            scene: this.scene,
            bounds: null,
            world: null,
        };
    }

    #dispose() {
        this.scene.dispose();
        this.engine.dispose();
    }

    override update(changes: PropertyValues) {
        if (changes.has("moving")) this._movingCtrl = this._toggleCtrl(this._movingCtrl, this.moving, MovingController);
        if (changes.has("shuffling")) this._shufflingCtrl = this._toggleCtrl(this._shufflingCtrl, this.shuffling, ShufflingController);
        if (changes.has("killing")) this._killingCtrl = this._toggleCtrl(this._killingCtrl, this.killing, KillingController);

        if (changes.has("_ctx_dirty") && this._ctx_dirty) this.#refreshCtx();
        
        super.update(changes);
    }

    override updated(changes: PropertyValues) {
        if (changes.has("pick")) {
            queueEvent<PickDetail>(this, "babylon.picked", { state: "picked", mesh: this.pick?.pickedMesh?.id });
        }
    }
}
