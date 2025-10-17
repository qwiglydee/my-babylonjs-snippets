import { consume } from "@lit/context";
import { ReactiveElement, type PropertyValues } from "lit";
import { customElement  } from "lit/decorators.js";

import { sceneCtx, type SceneCtx } from "./context";
// import { debugChanges } from "./utils/debug";

@customElement("my-something")
export class MySomethingElem extends ReactiveElement {
    @consume({ context: sceneCtx, subscribe: true })
    ctx!: SceneCtx;

    override update(changes: PropertyValues) {
        // debugChanges(this, "updating", changes);
        super.update(changes);
    }
}
