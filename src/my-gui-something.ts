import { consume } from "@lit/context";
import { ReactiveElement, type PropertyValues } from "lit";
import { customElement, state, property } from "lit/decorators.js";

import type { Scene } from "@babylonjs/core/scene";
import { AdvancedDynamicTexture } from "@babylonjs/gui/2D/advancedDynamicTexture";
import { Control } from "@babylonjs/gui/2D/controls/control";
import { Button } from "@babylonjs/gui/2D/controls/button";
import { TextBlock } from "@babylonjs/gui/2D/controls/textBlock";

import { sceneCtx, type ModelCtx, modelCtx, guiCtx } from "./context";
import { debug, debugChanges } from "./utils/debug";

@customElement("my-gui-something")
export class MyGUISomethingElem extends ReactiveElement {
    @consume({ context: sceneCtx, subscribe: false })
    scene!: Scene;

    @consume({ context: guiCtx, subscribe: false })
    gui!: AdvancedDynamicTexture;

    @consume({ context: modelCtx, subscribe: true })
    @state()
    model!: ModelCtx;

    @property()
    name: string = "button";

    override connectedCallback(): void {
        super.connectedCallback();
        this.#init()
        this._button.onPointerClickObservable.add(() => {
            debug(this, "clicked");
        });
    }

    _button!: Button;

    #init() {
        debug(this, "initilizing");
        this._button = new Button(this.name);
        this._button.widthInPixels = 64 + 16;
        this._button.heightInPixels = 32 + 16;
        this._button.background = "white";
        this._button.color = "black";
        this._button.thickness = 2;
        this._button.cornerRadius = 4;
        this._button.setPaddingInPixels(8);
        this._button.verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;

        const text = new TextBlock(`${this.name}_label`, this.textContent);
        text.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        text.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
        this._button.addControl(text);

        this.gui.addControl(this._button);
    }

    override update(changes: PropertyValues) {
        debugChanges(this, "updating", changes);
        super.update(changes);
    }
}
