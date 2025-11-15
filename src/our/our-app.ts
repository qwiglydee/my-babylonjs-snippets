import { PropertyValues, ReactiveElement } from "lit";
import { customElement, state } from "lit/decorators.js";

import { WithoutShadow } from "@utils/noshadow";
import { queueEvent } from "@utils/events";
import { PickEvent } from "./context";

/**
 * Babylon-unaware web app
 * For orchestrating purposes only
 */
@customElement("our-app")
export class OurAppElem extends WithoutShadow(ReactiveElement) {
    @state()
    status: string = "...";
    
    override connectedCallback(): void {
        super.connectedCallback();
        this.status = "Hello"; 
        this.addEventListener('babylon.picked', this.#onpicked as EventListener)
    }

    #onpicked = (event: PickEvent) => {
        if (event.detail) {
            this.status = `Selected: ${event.detail.name} (${event.detail.id})`;
        } else {
            this.status = "...";
        }
    }

    protected override updated(changes: PropertyValues): void {
        if (changes.has('status')) queueEvent(this, "app.status", this.status);
    }
} 