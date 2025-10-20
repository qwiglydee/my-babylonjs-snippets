import type { ReactiveController } from "lit";

import { PointerDragBehavior } from "@babylonjs/core/Behaviors/Meshes/pointerDragBehavior";
import { Vector3 } from "@babylonjs/core/Maths";

import type { BabylonElement } from "../interface";
import { debug } from "../utils/debug";

export class MovingController implements ReactiveController {
    host: BabylonElement;

    dragBhv!: PointerDragBehavior;
    dragDist = 0;

    constructor(host: BabylonElement) {
        this.host = host;
    }

    hostConnected(): void {
        this.#init();
    }

    #init() {
        this.dragBhv = new PointerDragBehavior({ dragPlaneNormal: Vector3.Up() });
        this.dragBhv.onDragStartObservable.add(() => {
            debug(this, "drag started", this.dragDist);
            this.dragDist = 0;
        });
        this.dragBhv.onDragObservable.add((data: {dragDistance: number}) => {
            this.dragDist += data.dragDistance;
            debug(this, "dragging", this.dragDist);
        });
        this.dragBhv.onDragEndObservable.add(() => {
            debug(this, "drag ended", this.dragDist);
            if (this.dragDist > 0) {
                this.host.scene.onModelUpdatedObservable.notifyObservers([this.dragBhv.attachedNode]);
            }
            this.host.selected = null;
            this.host.requestUpdate();
        });
    }

    dispose() {
    }

    hostDisconnected(): void {
        this.dispose();
    }

    hostUpdated(): void {
        if (!this.host.hasUpdated) return;
        if (this.host.selected) {
            if (this.dragBhv.attachedNode !== this.host.selected) {
                debug(this, "grabbing", this.host.selected.id);
                this.dragBhv.attachedNode = this.host.selected;
            }
        } else {
            this.dragBhv.detach();
        }
    }

}