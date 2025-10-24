import { Vector3 } from "@babylonjs/core/Maths";
import type { Nullable } from "@babylonjs/core/types";
import { ShapeFactory } from "../factory";
import { debug } from "../utils/debug";
import { BabylonController } from "./base";

export class DroppingController extends BabylonController {

    factory: Nullable<ShapeFactory> = null;

    init() {
        debug(this, "init");
        this.host.ondragenter = (ev: DragEvent) => {
            ev.preventDefault();
            if (!this.host.dragging) return;
            this.factory = new ShapeFactory(this.scene, this.host.dragging);
        }

        this.host.ondragleave = (event: DragEvent) => {
            event.preventDefault();
            if (!this.host.dragging) return;
            this.factory = null;
        }

        this.host.ondragover = (ev: DragEvent) => {
            ev.preventDefault();
        } 

        this.host.ondrop = (ev: DragEvent) => {
            ev.preventDefault();
            if (!this.factory) return;
            debug(this, "creating");
            this.factory?.createEntity(Vector3.Zero());
        }
    }

    dispose() {
        debug(this, "dispose");
        this.host.ondragenter = null;
        this.host.ondragleave = null;
        this.host.ondragover = null;
        this.host.ondrop = null;
    }

    updating() {}

    update() {}
}
