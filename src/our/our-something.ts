/*** the file uses babylon element internals without importing interfaces */

import { css, html, LitElement, nothing } from "lit";
import { customElement, state } from "lit/decorators.js";
import { consume } from "@lit/context";
import { assertNonNull } from "@utils/asserts";

import { babylonCtx, type IBabylonElement } from "./context";
import { debug } from "@utils/debug";


@customElement("our-something")
export class OurSomethingElem extends LitElement {
    @consume({ context: babylonCtx, subscribe: false })
    babylon!: IBabylonElement;

    static override styles = css`
        :host {
            display: block;
        }
    `

    @state()
    dimensions?: { x: number, y: number, z: number; };

    override render() {
        if (!this.dimensions) return nothing;
        return html`
            <span>${this.dimensions.x.toFixed(1)}×${this.dimensions.y.toFixed(1)}×${this.dimensions.z.toFixed(1)}</span>
        `
    }

    override connectedCallback(): void {
        super.connectedCallback();
        assertNonNull(this.babylon);
        this.babylon.addEventListener('babylon.updated', this.#onupdate);
    }

    #onupdate = () => {
        debug(this, "got babylon update");
        this.dimensions = this.babylon.getWorldSize();
    }
}