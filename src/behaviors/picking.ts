import type { ReactiveController } from "lit";

import type { PickingInfo } from "@babylonjs/core/Collisions/pickingInfo";
import { PointerEventTypes, type PointerInfo } from "@babylonjs/core/Events/pointerEvents";
import type { Mesh } from "@babylonjs/core/Meshes/mesh";
import type { Nullable } from "@babylonjs/core/types";
import type { BabylonElement } from "../interface";
import { debug } from "../utils/debug";

export class PickingController implements ReactiveController {
    host: BabylonElement;

    pickInfo: Nullable<PickingInfo> = null;

    constructor(host: BabylonElement) {
        this.host = host;
    }

    dispose() {
    }

    hostConnected(): void {
        queueMicrotask(() => this.#init()); // after host init scene
    }

    hostDisconnected(): void {
        this.dispose();
    }

    #init() {
        this.host.scene.onPointerObservable.add((info: PointerInfo) => {
            if (info.type == PointerEventTypes.POINTERTAP && info.pickInfo) this.#pick(info.pickInfo);
        });
    }

    #pick(pick: PickingInfo) {
        debug(this, "picking", pick.pickedMesh?.id);
        this.pickInfo = pick;
        this.host.selected = pick.pickedMesh ? (pick.pickedMesh as Mesh) : null;
        this.host.requestUpdate();
    }
}