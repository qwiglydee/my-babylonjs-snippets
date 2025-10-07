import { consume } from "@lit/context";
import { ReactiveElement, type PropertyValues } from "lit";
import { customElement, state } from "lit/decorators.js";

import type { Nullable } from "@babylonjs/core/types";

import { babylonCtx, type BabylonCtx } from "./context";
import { debugChanges } from "./utils/debug";

@customElement("my-something")
export class MySomethingElem extends ReactiveElement {
    @consume({ context: babylonCtx, subscribe: true })
    @state()
    ctx: Nullable<BabylonCtx> = null;

    protected override shouldUpdate(_changes: PropertyValues): boolean {
        return this.ctx != null;
    }

    override update(changes: PropertyValues) {
        debugChanges(this, "updating", changes);
        super.update(changes);
    }
}
