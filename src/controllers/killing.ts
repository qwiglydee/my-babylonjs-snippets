import { KeyboardEventTypes, type KeyboardInfo } from "@babylonjs/core/Events/keyboardEvents";
import type { Mesh } from "@babylonjs/core/Meshes/mesh";

import { BabylonController } from "./base";

export class KillingController extends BabylonController {
    radius: number = 3;

    #obs: any;

    init() {
        this.#obs = this.scene.onKeyboardObservable.add((info: KeyboardInfo) => {
            if (info.type == KeyboardEventTypes.KEYDOWN && info.event.key == 'x' && this.picked) {
                this.#kill(this.picked);
                this.host.pick = null;
                this.host.requestUpdate('pick');
            }
        });
    }

    dispose() {
        if (this.#obs) this.#obs.remove();
    }
    
    updating() {}
    update() {}

    #kill(mesh: Mesh) {
        mesh.dispose();
        this.scene.onModelUpdatedObservable.notifyObservers([mesh]);
    }
}
