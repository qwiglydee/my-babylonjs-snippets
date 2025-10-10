import { consume } from "@lit/context";
import { ReactiveElement, type PropertyValues } from "lit";
import { customElement  } from "lit/decorators.js";

import type { Nullable } from "@babylonjs/core/types";
import type { PickingInfo } from "@babylonjs/core/Collisions/pickingInfo";

import { babylonCtx, pickCtx, type BabylonCtx } from "./context";
import { debug, debugChanges } from "./utils/debug";

@customElement("my-something")
export class MySomethingElem extends ReactiveElement {
    @consume({ context: babylonCtx, subscribe: true })
    ctx: Nullable<BabylonCtx> = null;

    @consume({ context: pickCtx, subscribe: true })
    pick: Nullable<PickingInfo> = null;

    protected override shouldUpdate(_changes: PropertyValues): boolean {
        return this.ctx != null;
    }

    override update(changes: PropertyValues) {
        debugChanges(this, "updating", changes);
        debug(this, "updating ctx", { ctx: this.ctx, pick: this.pick });
        super.update(changes);
    }
}
