import { consume } from "@lit/context";
import { ReactiveElement, type PropertyValues } from "lit";
import { customElement, property, state } from "lit/decorators.js";

import { ArcRotateCamera, ComputeAlpha, ComputeBeta } from "@babylonjs/core/Cameras/arcRotateCamera";
import type { PickingInfo } from "@babylonjs/core/Collisions/pickingInfo";
import { Lerp, Vector3 } from "@babylonjs/core/Maths";
import { Tools } from "@babylonjs/core/Misc/tools";
import type { Nullable } from "@babylonjs/core/types";

import { sceneCtx, pickCtx, type SceneCtx } from "./context";
import { assertNonNull } from "./utils/asserts";
import { debug } from "./utils/debug";

@customElement("my-camera-arc")
export class MyArcCameraElem extends ReactiveElement {
    @consume({ context: sceneCtx, subscribe: true })
    @state()
    ctx!: SceneCtx;

    @consume({ context: pickCtx, subscribe: true })
    @state()
    pick: Nullable<PickingInfo> = null;

    @property({ type: Number })
    initAlpha = 45;

    @property({ type: Number })
    initBeta = 45;

    /** adjust zoom to fit whole scene when it changes */
    @property({ type: Boolean })
    autoZoom = false;

    @property({ type: Number })
    zoomFactor = 1.0;

    /** rotate and zoom towards picked mesh */
    @property({ type: Boolean })
    autoFocus = false;

    /**
     * focusFactor = 0 -- keep current distance (rotate only)
     * focusFactor = 1 -- zoom to fit
     */
    @property({ type: Number })
    focusFactor = 0.5;

    @property({ type: Boolean })
    autoSpin = false;

    override connectedCallback(): void {
        super.connectedCallback();
        this.#init();
        this._camera.onEnabledStateChangedObservable.add(() => {
            if (this._camera.isEnabled()) {
                this._camera.useAutoRotationBehavior = this.autoSpin;
                this._camera.attachControl(); 
            } else { 
                this._camera.useAutoRotationBehavior = false;
                this._camera.detachControl();
            }
        });
        this._camera.setEnabled(true);
        this.ctx!.scene.activeCamera = this._camera;
    }

    _camera!: ArcRotateCamera;

    #init() {
        debug(this, "initializing");
        const scene = this.ctx.scene;
        const radius = this.ctx.world.extendSize.length();
        this._camera = new ArcRotateCamera("(Camera)", Tools.ToRadians(this.initAlpha), Tools.ToRadians(this.initBeta), radius, Vector3.Zero(), scene);
        this._camera.setEnabled(false);
        this._camera.minZ = 0.001;
        this._camera.maxZ = 1000;
        this._camera.lowerRadiusLimit = 1;
        this._camera.upperRadiusLimit = radius;
        this._camera.wheelDeltaPercentage = 0.01; // ??
        this._camera.useNaturalPinchZoom = true;
    }

    #adjust(params: { alpha?: number; beta?: number; radius?: number; target?: Vector3 }) {
        this._camera.autoRotationBehavior?.resetLastInteractionTime();
        const alpha = params.alpha ?? this._camera.alpha;
        const beta = params.beta ?? this._camera.beta;
        const radius = params.radius ?? this._camera.radius;
        const target = params.target ?? this._camera.target;
        this._camera.lowerRadiusLimit = radius * 0.5;
        this._camera.interpolateTo(alpha, beta, radius, target);
    }

    /** move to initial position and best zoom */
    reset() {
        let target: Vector3, radius: number;
        if (this.ctx.bounds) {
            target = this.ctx.bounds.center;
            radius = this._camera._calculateLowerRadiusFromModelBoundingSphere(this.ctx.bounds.minimum, this.ctx.bounds.maximum);
        } else {
            target = Vector3.Zero();
            radius = this.ctx.world.extendSize.length();
        }
        const alpha = Tools.ToRadians(this.initAlpha);
        const beta = Tools.ToRadians(this.initBeta); 
        debug(this, "resetting");
        this.#adjust({target, radius, alpha, beta});
    }

    /** zoom to fit all scene (keep angle) */
    reframe() {
        let radius: number;
        if (this.ctx.bounds) {
            radius = this._camera._calculateLowerRadiusFromModelBoundingSphere(this.ctx.bounds.minimum, this.ctx.bounds.maximum, this.zoomFactor);
        } else {
            radius = this.ctx.world.extendSize.length();
        }
        debug(this, "reframing");
        this.#adjust({ radius });
    }

    /** move/rotate towards picked for best view */
    refocus() {
        assertNonNull(this.pick?.pickedMesh) 
        const bbox = this.pick.pickedMesh.getBoundingInfo().boundingBox;
        const target = bbox.centerWorld;
        const vector = this._camera.position.subtract(target);
        const dist = vector.length();
        const best = this._camera._calculateLowerRadiusFromModelBoundingSphere(bbox.minimumWorld, bbox.maximumWorld);
        const radius = Lerp(dist, best, this.focusFactor); 
        const alpha = ComputeAlpha(vector);
        const beta = ComputeBeta(vector.y, radius)  
        debug(this, "refocusing");
        this.#adjust({target, radius, alpha, beta});
    }

    override update(changes: PropertyValues) {
        if ((changes.has("ctx") || changes.has("autoZoom")) && this.autoZoom) this.reframe();
        if ((changes.has("pick")|| changes.has("autoFocus")) && this.autoFocus) {
            if (this.pick) this.refocus();
            else this.reset();
        }
        if (changes.has("autoSpin")) this._camera.useAutoRotationBehavior = this.autoSpin;
        super.update(changes);
    }
}
