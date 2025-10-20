import type { ReactiveController } from "lit";

import type { Mesh } from "@babylonjs/core/Meshes/mesh";
import type { Nullable } from "@babylonjs/core/types";

import type { BabylonElem } from "../context";


export abstract class BabylonController implements ReactiveController {
    host: BabylonElem;

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
        // pospone until host elem initialized scene and stuff 
        queueMicrotask(() => this.init());
    }

    hostDisconnected(): void {
        this.dispose();
    }

    hostUpdate(): void {
        this.updating();
    }

    hostUpdated(): void {
        if (!this.host.hasUpdated) return; // skip first update
        this.update();
    }

    /** initialize stuff (after bbylon context created) */
    abstract init(): void;
    /** release stuff (when disconnected or removed) */
    abstract dispose(): void
    /** before host elem update: modify it's context */
    abstract updating(): void;
    /** after host updated: reflect changes */
    abstract update(): void;
}