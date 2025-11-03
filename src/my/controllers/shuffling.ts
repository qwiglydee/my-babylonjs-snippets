import { KeyboardEventTypes, type KeyboardInfo } from "@babylonjs/core/Events/keyboardEvents";
import type { Mesh } from "@babylonjs/core/Meshes/mesh";

import { debug } from "@utils/debug";
import { BabylonController } from "./base";

export class ShufflingController extends BabylonController {
    radius: number = 3;

    #obs: any;

    init() {
        this.#obs = this.scene.onKeyboardObservable.add((info: KeyboardInfo) => {
            if (info.type == KeyboardEventTypes.KEYDOWN && this.picked) this.#shuffle(this.picked, info.event.key);
        });
    }

    dispose() {
        if (this.#obs) this.#obs.remove();
    }
    
    updating() {}
    update() {}

    #shuffle(mesh: Mesh, key: string) {
        if (!"gsr".includes(key)) return;
        debug(this, "shuffling", mesh.id);
        switch (key) {
            case "g":
                mesh.position.x += (Math.random() * 2 - 1) * this.radius;
                mesh.position.z += (Math.random() * 2 - 1) * this.radius;
                break;
            case "s":
                mesh.scaling.x *= Math.random() + 0.51;
                mesh.scaling.z *= Math.random() + 0.51;
                break;
            case "r":
                mesh.rotation.z = (Math.random() * 2 - 1) * Math.PI;
                mesh.rotation.x = (Math.random() * 2 - 1) * Math.PI;
                break;
        }
        this.scene.onModelUpdatedObservable.notifyObservers([mesh]);
    }
}
