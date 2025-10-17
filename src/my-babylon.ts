import { provide } from "@lit/context";
import { css, html, ReactiveElement, render, type PropertyValues } from "lit";
import { customElement, property, query, state } from "lit/decorators.js";

import { PointerDragBehavior } from "@babylonjs/core/Behaviors/Meshes/pointerDragBehavior";
import type { PickingInfo } from "@babylonjs/core/Collisions/pickingInfo";
import { AxesViewer } from "@babylonjs/core/Debug/axesViewer";
import { Engine } from "@babylonjs/core/Engines/engine";
import type { EngineOptions } from "@babylonjs/core/Engines/thinEngine";
import { PointerEventTypes, PointerInfo } from "@babylonjs/core/Events/pointerEvents";
import "@babylonjs/core/Layers/effectLayerSceneComponent";
import { HighlightLayer } from "@babylonjs/core/Layers/highlightLayer";
import { Color3, Color4, Vector3 } from "@babylonjs/core/Maths";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { UtilityLayerRenderer } from "@babylonjs/core/Rendering/utilityLayerRenderer";
import type { Scene } from "@babylonjs/core/scene";
import type { Nullable } from "@babylonjs/core/types";

import { pickCtx, sceneCtx, utilsCtx, type PickDetail, type SceneCtx } from "./context";
import { MyScene } from "./scene";
import { assertNonNull } from "./utils/asserts";
import { debug } from "./utils/debug";
import { bubbleEvent, queueEvent } from "./utils/events";

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
        if (this.picking) this.#initPicking();
        if (this.dragging) this.#initDragging();
        if (this.highlighting) this.#initHighlighting();
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
        this.scene = new MyScene(this.engine, Vector3.One().scale(this.worldSize));
        this.scene.useRightHandedSystem = this.rightHanded;
        this.scene.clearColor = Color4.FromHexString(getComputedStyle(this).getPropertyValue("--my-background-color"));
        this.utils = new UtilityLayerRenderer(this.scene, false, false).utilityLayerScene;

        this.scene.onModelUpdatedObservable.add(() => this.#invalidateCtx());

        new AxesViewer(this.utils);
        // NB: initial ctx scene is not ready yet but it's empty
        this.ctx = {
            scene: this.scene,
            world: this.scene.getWorldBounds(),
            bounds: null,
        }
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
    _dragDist = 0;
    #initDragging() {
        this._dragBhv = new PointerDragBehavior({ dragPlaneNormal: Vector3.Up() });
        this._dragBhv.onDragStartObservable.add(() => {
            this._dragDist = 0;
            this.ongrabbed(this._dragBhv!.attachedNode as Mesh)
        });
        this._dragBhv.onDragEndObservable.add(() => {
            this.ondropped(this._dragBhv!.attachedNode as Mesh, this._dragDist);
        });
        this._dragBhv.onDragObservable.add((data: {dragDistance: number}) => {
            this._dragDist += data.dragDistance;
        });
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
        if (changes.has("_ctx_dirty") && this._ctx_dirty) this.#refreshCtx();
        super.update(changes);
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

        queueEvent<PickDetail>(this, "babylon.picked", { state: "picked", mesh: this._selected.id });
    }

    unpick() {
        if (this._selected) this.#deselect(this._selected);
        this._selected = null;
        this.pick = null;
        queueEvent<PickDetail>(this, "babylon.picked", { mesh: null });
    }

    ongrabbed(mesh: Mesh) {
        assertNonNull(mesh);
        queueEvent<PickDetail>(this, "babylon.grabbed", { state: "dragging", mesh: mesh.id });
    }

    ondropped(mesh: Mesh, dist: number) {
        assertNonNull(mesh);
        if (dist == 0) return;
        this.unpick();
        this.#invalidateCtx();
        queueEvent<PickDetail>(this, "babylon.dropped", { state: "dropped", mesh: mesh.id });
    }
}
