import { consume } from "@lit/context";
import { ReactiveElement, type PropertyValues } from "lit";
import { customElement  } from "lit/decorators.js";

import type { Nullable } from "@babylonjs/core/types";

import { sceneCtx, type SceneCtx } from "./context";
import { debugChanges } from "./utils/debug";

@customElement("my-something")
export class MySomethingElem extends ReactiveElement {
    @consume({ context: sceneCtx, subscribe: true })
    ctx: Nullable<SceneCtx> = null;

    protected override shouldUpdate(_changes: PropertyValues): boolean {
        return this.ctx != null;
    }

    override update(changes: PropertyValues) {
        debugChanges(this, "updating", changes);
        super.update(changes);
    }
}
