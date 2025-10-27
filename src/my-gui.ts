import { consume, provide } from "@lit/context";
import { ReactiveElement } from "lit";
import { customElement, property } from "lit/decorators.js";

import type { Scene } from "@babylonjs/core/scene";
import { AdvancedDynamicTexture } from "@babylonjs/gui/2D/advancedDynamicTexture";

import { sceneCtx, guiCtx } from "./context";

@customElement("my-gui")
export class MyGUIElem extends ReactiveElement {
    @consume({ context: sceneCtx, subscribe: false })
    scene!: Scene;

    @provide({ context: guiCtx })
    txt!: AdvancedDynamicTexture;

    @property()
    name: string = "GUI";

    @property({ type: Boolean })
    foreground = false;

    override connectedCallback(): void {
        super.connectedCallback();
        this.txt = AdvancedDynamicTexture.CreateFullscreenUI(this.name, this.foreground, this.scene);
    }

    override disconnectedCallback(): void {
        this.txt.dispose();
        super.disconnectedCallback();
    }
}
