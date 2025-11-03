import { css, html, LitElement } from "lit";
import { customElement, state } from "lit/decorators.js";
import { consume } from "@lit/context";

import { type AppCtx, appCtx } from "./context";


@customElement("our-status")
export class OurStatusElem extends LitElement {
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