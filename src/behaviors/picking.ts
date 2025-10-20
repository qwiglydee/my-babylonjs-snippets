import type { PickingInfo } from "@babylonjs/core/Collisions/pickingInfo";
import { PointerEventTypes, type PointerInfo } from "@babylonjs/core/Events/pointerEvents";

import { debug } from "../utils/debug";
import { BabylonController } from "./base";

export class PickingController extends BabylonController {

    #obs: any = null;

    init() {
        debug(this, "init");
        this.#obs = this.scene.onPointerObservable.add((info: PointerInfo) => {
            if (info.type == PointerEventTypes.POINTERTAP && info.pickInfo) {
                if (info.pickInfo?.pickedMesh) this.#pick(info.pickInfo);
                else this.#unpick();
            }
        });
    }

    dispose() {
        debug(this, "dispose");
        this.#unpick();
        if (this.#obs) this.#obs.remove();
    }

    updating() {}

    update() {}

    #pick(info: PickingInfo) {
        debug(this, "picking", info.pickedMesh?.id);
        this.host.pick = info;
        this.host.requestUpdate('pick');
    }

    #unpick() {
        this.host.pick = null;
        this.host.requestUpdate('pick');
    }
}
