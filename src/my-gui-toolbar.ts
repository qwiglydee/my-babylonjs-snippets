import { consume } from "@lit/context";
import { ReactiveElement, type PropertyValues } from "lit";
import { customElement, property } from "lit/decorators.js";

import type { EventState } from "@babylonjs/core/Misc/observable";
import type { Nullable } from "@babylonjs/core/types";
import type { AdvancedDynamicTexture } from "@babylonjs/gui/2D/advancedDynamicTexture";
import { Button } from "@babylonjs/gui/2D/controls/button";
import { Container } from "@babylonjs/gui/2D/controls/container";
import { Rectangle } from "@babylonjs/gui/2D/controls/rectangle";
import type { Vector2WithInfo } from "@babylonjs/gui/2D/math2D";

import { guiCtx, sceneCtx, type SceneCtx } from "./context";
import { debug } from "./utils/debug";

@customElement("my-gui-toolbar")
export class MyGUIToolbarElem extends ReactiveElement {
    @consume({ context: sceneCtx, subscribe: true })
    ctx: Nullable<SceneCtx> = null;
    
    @consume({ context: guiCtx, subscribe: false })
    gui!: AdvancedDynamicTexture;

    @property({ type: Number })
    zIndex = 100;

    override update(changes: PropertyValues) {
        if (!this.hasUpdated) this.#init();
        else {
            if (changes.has('zIndex')) {
                this._toolbar.zIndex = this.zIndex;
            }
        }
        super.update(changes);
    }

    _toolbar!: Container;

    #init() {
        debug(this, "creating");
        const rect = new Rectangle();
        rect.verticalAlignment = Container.VERTICAL_ALIGNMENT_TOP;
        rect.adaptHeightToChildren = true;
        rect.width = "100%";
        rect.background = "lightgray";
        rect.thickness = 0;
        rect.zIndex = this.zIndex;
        this._toolbar = rect; 
        this.gui!.addControl(rect);
    
        const btn: Button = Button.CreateSimpleButton("", "click me");
        btn.verticalAlignment = Container.VERTICAL_ALIGNMENT_CENTER;
        btn.horizontalAlignment = Container.HORIZONTAL_ALIGNMENT_LEFT
        btn.widthInPixels = 100;
        btn.heightInPixels = 48;
        btn.paddingTopInPixels = 4;
        btn.paddingBottomInPixels = 4;
        btn.paddingLeftInPixels = 8;
        btn.paddingRightInPixels = 8;
        btn.cornerRadius = 26;
        btn.color = "white";
        btn.background = "gray";
        btn.onPointerClickObservable.add((data, state) => this.#onclick(data, state));
        this._toolbar.addControl(btn);
    }

    #onclick(data: Vector2WithInfo, state: EventState) {
        debug(this, 'clicked', { data, state });
    }
}