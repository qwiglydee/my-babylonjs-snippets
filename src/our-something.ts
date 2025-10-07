import { css, html, LitElement, nothing, type PropertyValues } from "lit";
import { customElement, state } from "lit/decorators.js";
import { consume } from "@lit/context";

import type { Nullable } from "@babylonjs/core/types";

import { type AppCtx, appCtx } from "./context";
import { debug } from "./utils/debug";


@customElement("our-something")
export class OurSomethingElem extends LitElement {
    @consume({ context: appCtx, subscribe: true })
    @state()
    ctx: Nullable<AppCtx> = null;

    static override styles = css`
        :host {
            display: block;
        }

        .message {
            text-align: center;
        }
    `

    override connectedCallback(): void {
        super.connectedCallback();
        debug(this, "connected");
    }

    override update(changes: PropertyValues) {
        super.update(changes);
    }

    override render() {
        if (!this.ctx) return nothing;
        return html`
            <div class="message">${this.ctx.foo}</div>
        `
    }
}