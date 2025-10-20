import { PointerDragBehavior } from "@babylonjs/core/Behaviors/Meshes/pointerDragBehavior";
import { Vector3 } from "@babylonjs/core/Maths";
import type { Mesh } from "@babylonjs/core/Meshes/mesh";
import { debug } from "../utils/debug";
import { BabylonController } from "./base";

export class MovingController extends BabylonController {
    dragBhv!: PointerDragBehavior;
    dragDist = 0;

    init() {
        this.dragBhv = new PointerDragBehavior({ dragPlaneNormal: Vector3.Up() });
        this.dragBhv.onDragStartObservable.add(() => {
            this.dragDist = 0;
        });
        this.dragBhv.onDragObservable.add((data: { dragDistance: number }) => {
            this.dragDist += data.dragDistance;
        });
        this.dragBhv.onDragEndObservable.add(() => {
            if (this.dragDist > 0) {
                this.scene.onModelUpdatedObservable.notifyObservers([this.dragBhv.attachedNode]);
            }
            this.host.pick = null;
            this.host.requestUpdate();
        });
    }

    dispose() {}

    updating() {}

    update(): void {
        if (this.picked) this.#pick(this.picked);
        else this.#unpick();
    }

    #pick(mesh: Mesh) {
        if (this.dragBhv.attachedNode !== mesh) {
            debug(this, "grabbing", mesh.id);
            this.dragBhv.attach(mesh);
        }
    }

    #unpick() {
        this.dragBhv.detach();
    }
}
