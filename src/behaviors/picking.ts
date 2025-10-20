
import type { PickingInfo } from "@babylonjs/core/Collisions/pickingInfo";
import { PointerEventTypes, type PointerInfo } from "@babylonjs/core/Events/pointerEvents";

import { debug } from "../utils/debug";
import { BabylonController } from "./base";

export class PickingController extends BabylonController {
    init() {
        this.scene.onPointerObservable.add((info: PointerInfo) => {
            if (info.type == PointerEventTypes.POINTERTAP && info.pickInfo) {
                if (info.pickInfo?.pickedMesh) this.#pick(info.pickInfo);
                else this.#unpick();
            }
        });
    }

    dispose() {}
    updating() {}
    update() {}

    #pick(info: PickingInfo) {
        debug(this, "picking", info.pickedMesh?.id);
        this.host.pick = info;
        this.host.requestUpdate();
    }

    #unpick() {
        this.host.pick = null;
        this.host.requestUpdate();
    }
}
