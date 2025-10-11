import { consume } from "@lit/context";
import { ReactiveElement, type PropertyValues } from "lit";
import { customElement, property, state } from "lit/decorators.js";

import { ArcRotateCamera, ComputeAlpha, ComputeBeta } from "@babylonjs/core/Cameras/arcRotateCamera";
import type { PickingInfo } from "@babylonjs/core/Collisions/pickingInfo";
import { BoundingBox } from "@babylonjs/core/Culling/boundingBox";
import { Lerp, Vector3 } from "@babylonjs/core/Maths";
import { Tags } from "@babylonjs/core/Misc/tags";
import { Tools } from "@babylonjs/core/Misc/tools";
import type { Nullable } from "@babylonjs/core/types";

import { babylonCtx, pickCtx, type BabylonCtx } from "./context";
import { assertNonNull } from "./utils/asserts";
import { debug } from "./utils/debug";

@customElement("my-camera-arc")
export class MyArcCameraElem extends ReactiveElement {
    @consume({ context: babylonCtx, subscribe: true })
    @state()
    ctx: Nullable<BabylonCtx> = null;

    @consume({ context: pickCtx, subscribe: true })
    @state()
    pick: Nullable<PickingInfo> = null;

    @property({ type: Number })
    initAlpha = 45;

    @property({ type: Number })
    initBeta = 45;

    @property({ type: Boolean })
    autoZoom = false;

    @property({ type: Number })
    zoomFactor = 1.0;

    @property({ type: Boolean })
    autoFocus = false;

    @property({ type: Number })
    focusFactor = 0.75;

    @property({ type: Boolean })
    autoSpin = false;

    protected override shouldUpdate(_changes: PropertyValues): boolean {
        return this.ctx != null;
    }

    override update(changes: PropertyValues) {
        if (!this.hasUpdated) this.#create();
        else {
            if ((changes.has("ctx") || changes.has("autoZoom")) && this.autoZoom) {
                if (this.pick) this.retarget();
                else this.reframe();
            }
            if ((changes.has("pick") || changes.has("autoFocus")) && this.autoFocus) {
                this.refocus();
            }
            if (changes.has("autoSpin")) this._camera.useAutoRotationBehavior = this.autoSpin;
        }
        super.update(changes);
    }

    _camera!: ArcRotateCamera;

    #create() {
        debug(this, "creating");
        assertNonNull(this.ctx);
        const radius = 0.5 * this.ctx.size;
        this._camera = new ArcRotateCamera("(Camera)", Tools.ToRadians(this.initAlpha), Tools.ToRadians(this.initBeta), radius, Vector3.Zero(), this.ctx.scene);
        Tags.AddTagsTo(this._camera, "scenery");
        this._camera.minZ = 0.001;
        this._camera.maxZ = 1000;
        this._camera.lowerRadiusLimit = 1;
        this._camera.upperRadiusLimit = radius;
        this._camera.wheelDeltaPercentage = 0.01; // ??
        this._camera.useNaturalPinchZoom = true;
        this._camera.attachControl();

        this._camera.useAutoRotationBehavior = this.autoSpin;

        this.ctx.scene.activeCamera = this._camera;
        this.ctx.scene.onActiveCameraChanged.add(() => this._camera.autoRotationBehavior?.resetLastInteractionTime());
    }

    /** reset to initial position */
    reset(params: { alpha?: number; beta?: number; radius?: number; target?: Vector3 } = {}) {
        assertNonNull(this.ctx);
        this._camera.autoRotationBehavior?.resetLastInteractionTime();
        this._camera.target = params.target ?? Vector3.Zero();
        this._camera.radius = params.radius ?? this.ctx!.size * 0.5;
        this._camera.alpha = params.alpha ?? Tools.ToRadians(this.initAlpha);
        this._camera.beta = params.beta ?? Tools.ToRadians(this.initBeta);
    }

    /** move to best view of picked or model */
    reframe() {
        assertNonNull(this.ctx);
        if (this.pick?.pickedMesh) {
            const bbox = this.pick.pickedMesh.getBoundingInfo().boundingBox;
            this._reframe({ min: bbox.minimumWorld, max: bbox.maximumWorld});
        } else {
            this._reframe(this.ctx.bounds);
        }
    }

    /** move/rotate towards picked or model */
    refocus() {
        assertNonNull(this.ctx);
        if (this.pick?.pickedMesh) 
            this._refocus(this.pick.pickedMesh.getBoundingInfo().boundingBox);
        else
            this._refocus(new BoundingBox(this.ctx.bounds.min, this.ctx.bounds.max));
    }

    /** rotate towards picked or model center */
    retarget() {
        assertNonNull(this.ctx);
        if (this.pick?.pickedMesh) 
            this._retarget(this.pick.pickedMesh.getBoundingInfo().boundingBox.centerWorld);
        else
            this._retarget(Vector3.Center(this.ctx.bounds.min, this.ctx.bounds.max));
    }

    #adjust(params: { alpha?: number; beta?: number; radius?: number; target?: Vector3 }) {
        this._camera.autoRotationBehavior?.resetLastInteractionTime();
        const alpha = params.alpha ?? this._camera.alpha;
        const beta = params.beta ?? this._camera.beta;
        const radius = params.radius ?? this._camera.radius;
        const target = params.target ?? this._camera.target;
        this._camera.lowerRadiusLimit = 0.5 * radius;
        this._camera.upperRadiusLimit = 1.5 * radius;
        this._camera.interpolateTo(alpha, beta, radius, target);
    }

    /** changing distance to fit bounds */
    _reframe(bounds: { min: Vector3; max: Vector3 }) {
        assertNonNull(this.ctx);
        debug(this, "reframing", bounds);
        const radius = this._camera._calculateLowerRadiusFromModelBoundingSphere(bounds.min, bounds.max, this.zoomFactor);
        this.#adjust({
            target: Vector3.Center(bounds.min, bounds.max),
            radius,
        });
    }

    /** rotating to target, keeping current position */
    _retarget(target: Vector3, distance?: number) {
        const vector = this._camera.position.subtract(target);
        const radius = distance ?? vector.length();
        debug(this, "retargeting", { target, distance });
        this.#adjust({
            target,
            radius,
            alpha: ComputeAlpha(vector),
            beta: ComputeBeta(vector.y, radius),
        });
    }

    /** rotating to target and ajusting distance, keeping current position
     * this.focusFactor == 0 -- not moving
     * this.focusFactor == 1 -- moving to best distance
     */
    _refocus(bbox: BoundingBox) {
        debug(this, "refocusing", { focus, name: focus.name });

        const target = bbox.centerWorld;
        const vector = this._camera.position.subtract(target);
        const dist = vector.length();
        const best = this._camera._calculateLowerRadiusFromModelBoundingSphere(bbox.minimumWorld, bbox.maximumWorld, this.zoomFactor);
        const radius = Lerp(dist, best, this.focusFactor); 

        this.#adjust({
            target,
            radius,
            alpha: ComputeAlpha(vector),
            beta: ComputeBeta(vector.y, radius),
        });
    }
}
