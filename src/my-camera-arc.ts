import { consume } from "@lit/context";
import { ReactiveElement, type PropertyValues } from "lit";
import { customElement, property, state } from "lit/decorators.js";

import { babylonCtx, type BabylonCtx } from "./context";
import { debug, debugChanges } from "./utils/debug";
import type { Nullable } from "@babylonjs/core/types";
import { assertNonNull } from "./utils/asserts";
import { ArcRotateCamera } from "@babylonjs/core/Cameras/arcRotateCamera";
import { Tools } from "@babylonjs/core/Misc/tools";
import { Vector3 } from "@babylonjs/core/Maths";

@customElement("my-camera-arc")
export class MyArcCameraElem extends ReactiveElement {
    @consume({ context: babylonCtx, subscribe: true })
    @state()
    ctx: Nullable<BabylonCtx> = null;

    @property({ type: Boolean })
    autoZoom = false;

    @property({ type: Number })
    zoomFactor = 0.5;

    @property({ type: Number })
    radius: Nullable<number> = null;

    @property({ type: Number })
    alpha: number = 45;

    @property({ type: Number })
    beta: number = 45;

    @property({ type: Boolean })
    autoSpin = false;

    protected override shouldUpdate(_changes: PropertyValues): boolean {
        return this.ctx != null;
    }

    override update(changes: PropertyValues) {
        if (!this.hasUpdated) this.#create();
        else {
            if ((changes.has("ctx") || changes.has("autoZoom")) && this.autoZoom) this.reframe();
            if (changes.has("alpha")) this._camera.alpha = Tools.ToRadians(this.alpha);
            if (changes.has("beta")) this._camera.beta = Tools.ToRadians(this.beta);
            if (changes.has("radius")) this._camera.radius = this.radius ?? 0.5 * this.ctx!.size;
            if (changes.has("autoSpin")) this._camera.useAutoRotationBehavior = this.autoSpin;
        }
        super.update(changes);
    }

    _camera!: ArcRotateCamera;

    #create() {
        debug(this, "creating");
        assertNonNull(this.ctx);
        const radius = this.radius ?? 0.5 * this.ctx.size;

        this._camera = new ArcRotateCamera("#camera", Tools.ToRadians(this.alpha), Tools.ToRadians(this.alpha), radius, Vector3.Zero(), this.ctx.scene);
        this._camera.minZ = 0.001;
        this._camera.maxZ = 1000;
        this._camera.lowerRadiusLimit = 1;
        this._camera.upperRadiusLimit = radius;
        this._camera.wheelDeltaPercentage = 0.01; // ??
        this._camera.useNaturalPinchZoom = true;
        this._camera.attachControl();

        this._camera.useAutoRotationBehavior = this.autoSpin;

        this.ctx.scene.activeCamera = this._camera;
    }

    reframe() {
        debug(this, "reframing", this.ctx?.bounds);
        assertNonNull(this.ctx);
        const distance = this._camera._calculateLowerRadiusFromModelBoundingSphere(this.ctx.bounds.min, this.ctx.bounds.max, this.zoomFactor);
        this._camera.radius = distance;
        this._camera.upperRadiusLimit = distance * 1.25;
        this._camera.focusOn({ ...this.ctx.bounds, distance }, true);
    }
}
