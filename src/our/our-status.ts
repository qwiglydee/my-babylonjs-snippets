import { css, html, LitElement, nothing } from "lit";
import { customElement, state } from "lit/decorators.js";

import { debug } from "@utils/debug";


@customElement("our-status")
export class OurStatusElem extends LitElement {
    @state()
    status?: string;

    static override styles = css`
        :host {
            display: block;
            text-align: center;
        }
    `
    override render() {
        debug(this, "rendering")
        if (!this.status) return nothing;
        return html`
            <span>${this.status}</span>
        `
    }

    override connectedCallback(): void {
        super.connectedCallback();
        this.ownerDocument.addEventListener('app.status', this.#onstatus as EventListener);
    }

    override disconnectedCallback(): void {
        this.ownerDocument.removeEventListener('app.status', this.#onstatus as EventListener);
        super.disconnectedCallback();
    }

    #onstatus = (ev: CustomEvent) => {
        this.status = ev.detail ?? ""; 
    }
}