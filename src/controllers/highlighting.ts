import { HighlightLayer } from "@babylonjs/core/Layers/highlightLayer";
import { Color3 } from "@babylonjs/core/Maths";
import type { Mesh } from "@babylonjs/core/Meshes/mesh";

import { debug } from "../utils/debug";
import { BabylonController } from "./base";

export class HighlightingController extends BabylonController {
    highlighter!: HighlightLayer;
    highloghtColor = Color3.Yellow();

    init() {
        this.highlighter = new HighlightLayer("(highlighter)", this.scene);
    }

    dispose() {
        this.highlighter.dispose();
    }

    updating() {}

    update(): void {
        if (this.picked) this.#pick(this.picked);
        else this.#unpick();
    }

    #pick(mesh: Mesh) {
        if (!this.highlighter.hasMesh(mesh)) {
            debug(this, "highlighing", mesh.id);
            this.highlighter.removeAllMeshes();
            this.highlighter.addMesh(mesh, this.highloghtColor);
        }
    }

    #unpick() {
        this.highlighter.removeAllMeshes();
    }
}
