import type { ReactiveController } from "lit";

import { KeyboardEventTypes, type KeyboardInfo } from "@babylonjs/core/Events/keyboardEvents";
import type { Mesh } from "@babylonjs/core/Meshes/mesh";
import { debug } from "../utils/debug";
import type { BabylonElem } from "../context";
import type { Nullable } from "@babylonjs/core/types";

export class ShufflingController implements ReactiveController {
    host: BabylonElem;

    radius: number = 3;

    constructor(host: BabylonElem) {
        this.host = host;
    }

    get scene() {
        return this.host!.ctx.scene;
    }
    get picked(): Nullable<Mesh> {
        return this.host.pick?.pickedMesh ? (this.host.pick?.pickedMesh as Mesh) : null;
    }

    hostConnected(): void {
        queueMicrotask(() => this.#init()); // after host init scene
    }

    #init() {
        this.scene.onKeyboardObservable.add((info: KeyboardInfo) => {
            if (info.type == KeyboardEventTypes.KEYDOWN && this.picked) this.#shuffle(this.picked, info.event.key);
        });
    }

    dispose() {}

    hostDisconnected(): void {
        this.dispose();
    }

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
