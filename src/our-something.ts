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
    ctx!: AppCtx;

    static override styles = css`
        :host {
            display: block;
        }

        .message {
            text-align: center;
        }
    `

    override render() {
        return html`
            <div class="message">${this.ctx.status}</div>
        `
    }
}