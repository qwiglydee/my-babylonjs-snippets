import type { ReactiveController } from "lit";

import { KeyboardEventTypes, type KeyboardInfo } from "@babylonjs/core/Events/keyboardEvents";
import type { Mesh } from "@babylonjs/core/Meshes/mesh";
import type { BabylonElement } from "../interface";
import { debug } from "../utils/debug";

export class ShufflingController implements ReactiveController {
    host: BabylonElement;

    radius: number = 3;

    constructor(host: BabylonElement) {
        this.host = host;
    }

    hostConnected(): void {
        queueMicrotask(() => this.#init()); // after host init scene
    }

    #init() {
        this.host.scene.onKeyboardObservable.add((info: KeyboardInfo) => {
            if (this.host.selected && info.type != KeyboardEventTypes.KEYDOWN) this.#shuffle(this.host.selected, info);
        });
    }

    dispose() {
    }

    hostDisconnected(): void {
        this.dispose();
    }

    #shuffle(selected: Mesh, info: KeyboardInfo) {
        if (!"gsr".includes(info.event.key)) return;
        debug(this, "shuffling", selected);
        switch (info.event.key) {
            case "g":
                selected.position.x += (Math.random() * 2 - 1) * this.radius;
                selected.position.z += (Math.random() * 2 - 1) * this.radius;
                break;
            case "s":
                selected.scaling.x *= (Math.random() + 0.51);
                selected.scaling.z *= (Math.random() + 0.51);
                break;
            case "r":
                selected.rotation.z = (Math.random() * 2 - 1) * Math.PI;
                selected.rotation.x = (Math.random() * 2 - 1) * Math.PI;
                break;
        }
        this.host.scene.onModelUpdatedObservable.notifyObservers([selected]);
    }
}