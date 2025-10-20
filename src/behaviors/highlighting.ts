import type { ReactiveController } from "lit";

import { HighlightLayer } from "@babylonjs/core/Layers/highlightLayer";
import { Color3 } from "@babylonjs/core/Maths";

import type { BabylonElement } from "../interface";
import { debug } from "../utils/debug";

export class HighlightingController implements ReactiveController {
    host: BabylonElement;

    highlighter!: HighlightLayer;
    highloghtColor = Color3.Yellow();

    constructor(host: BabylonElement) {
        this.host = host;
    }

    hostConnected(): void {
        queueMicrotask(() => this.#init()); // after host init scene
    }

    #init() {
        this.highlighter = new HighlightLayer("highlight", this.host.scene);
    }

    dispose() {
        this.highlighter.dispose();
    }

    hostDisconnected(): void {
        this.dispose();
    }

    hostUpdated(): void {
        if (!this.host.hasUpdated) return;
        if (this.host.selected) {
            if (!this.highlighter.hasMesh(this.host.selected)) {
                debug(this, "highlighing", this.host.selected.id);
                this.highlighter.removeAllMeshes();
                this.highlighter.addMesh(this.host.selected, this.highloghtColor);
            }
        } else {
            this.highlighter.removeAllMeshes();
        }
    }
}
