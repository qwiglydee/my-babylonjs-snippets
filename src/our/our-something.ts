import { css, html, LitElement, nothing, PropertyValues } from "lit";
import { customElement, state } from "lit/decorators.js";

import { debug } from "@utils/debug";
import { type IBabylonElement } from "./context";


@customElement("our-something")
export class OurSomethingElem extends LitElement {
    // maybe TODO: differentiate multiple babylons by selector
    babylon?: IBabylonElement;

    static override styles = css`
        :host {
            display: block;
        }
    `

    @state()
    dimensions?: { x: number, y: number, z: number; };

    protected override shouldUpdate(_changes: PropertyValues): boolean {
        return this.babylon !== null;
    }

    override render() {
        debug(this, "rendering")
        if (!this.dimensions) return nothing;
        return html`
            <span>${this.dimensions.x.toFixed(1)}×${this.dimensions.y.toFixed(1)}×${this.dimensions.z.toFixed(1)}</span>
        `
    }

    override connectedCallback(): void {
        super.connectedCallback();
        this.ownerDocument.addEventListener('babylon.init', this.#oninit);
    }

    override disconnectedCallback(): void {
        this.ownerDocument.removeEventListener('babylon.init', this.#oninit);
        this.babylon = undefined;
        super.disconnectedCallback();
    }

    #oninit = (ev: Event) => {
        this.babylon = ev.target as IBabylonElement;
        this.babylon.addEventListener('babylon.updated', this.#onupdate);
        // this.babylon.scene.onModelUpdateObserver.add(this.#onupdate)
    }

    #onupdate = () => {
        debug(this, "babylon updated");
        // using public API
        this.dimensions = this.babylon!.getWorldSize();
    }
}