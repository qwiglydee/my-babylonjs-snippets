import { consume } from "@lit/context";
import { ReactiveElement, type PropertyValues } from "lit";
import { customElement, property, state } from "lit/decorators.js";

import { ArcRotateCamera } from "@babylonjs/core/Cameras/arcRotateCamera";
import { Vector3 } from "@babylonjs/core/Maths";
import { Tools } from "@babylonjs/core/Misc/tools";

import { sceneCtx, type SceneCtx } from "./context";
import { assertNonNull } from "./utils/asserts";
import { debug } from "./utils/debug";

@customElement("my-camera-arc")
export class MyArcCameraElem extends ReactiveElement {
    @consume({ context: sceneCtx, subscribe: true })
    @state()
    ctx!: SceneCtx;

    @property({ type: Boolean })
    autoZoom = false;

    @property({ type: Boolean })
    autoSpin = false;

    @property({ type: Number })
    zoomFactor = 1.0;

    @property({ type: Number })
    defaultAlpha: number = 45;

    @property({ type: Number })
    defaultBeta: number = 45;

    @property({ type: Number })
    defaultRadius: number = 45;


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
    }

    #init() {
        debug(this, "initializing");
        const scene = this.ctx!.scene;
        const radius = this.defaultRadius;
        this._camera = new ArcRotateCamera("(Camera)", Tools.ToRadians(this.defaultAlpha), Tools.ToRadians(this.defaultBeta), radius, Vector3.Zero(), scene);
        this._camera.setEnabled(false);
        this._camera.minZ = 0.001;
        this._camera.maxZ = 1000;
        this._camera.lowerRadiusLimit = 0.5 * radius;
        this._camera.upperRadiusLimit = 2 * radius;
        this._camera.wheelDeltaPercentage = 0.01; // ??
        this._camera.useNaturalPinchZoom = true;
        scene.activeCamera = this._camera;
    }

    override update(changes: PropertyValues) {
        if ((changes.has("ctx") || changes.has("autoZoom")) && this.autoZoom) this.reframe();
        if (changes.has("autoSpin")) this._camera.useAutoRotationBehavior = this.autoSpin;
        super.update(changes);
    }

    _camera!: ArcRotateCamera;

    reframe() {
        debug(this, "reframing", this.ctx?.bounds);
        assertNonNull(this.ctx);
        this._camera.autoRotationBehavior?.resetLastInteractionTime();

        if (this.ctx.world) {
            const distance = this._camera._calculateLowerRadiusFromModelBoundingSphere(this.ctx.world.minimum, this.ctx.world.maximum, this.zoomFactor);
            this._camera.radius = distance;
            this._camera.focusOn({ min: this.ctx.world.minimum, max: this.ctx.world.maximum, distance }, true);
        } else {
            this._camera.radius = this.defaultRadius;
            this._camera.alpha = Tools.ToRadians(this.defaultAlpha);
            this._camera.beta = Tools.ToRadians(this.defaultBeta);
        }
    }
}
