import { ReactiveElement } from "lit";
import { customElement, query } from "lit/decorators.js";

import { assertNonNull } from "@utils/asserts";
import { WithoutShadow } from "@utils/noshadow";

import { PickEvent } from "./context";


// cherry picking internal api w/out importing babylon-bound code 
interface OurStuffElem extends HTMLElement {
    createItem(shape?: string): void;
}

@customElement("our-gui")
export class OurGuiElem extends WithoutShadow(ReactiveElement) {
    _mystuff?: OurStuffElem;

    @query('button[name=create]')
    button!: HTMLButtonElement;

    @query('select[name=shape]')
    select!: HTMLSelectElement;

    override connectedCallback(): void {
        super.connectedCallback();

        this.select.disabled = true;
        this.button.disabled = true;

        const mystuff = this.ownerDocument.querySelector('my-stuff');  
        assertNonNull(mystuff, "my-stuff not found");
        this._mystuff = mystuff as OurStuffElem;
        
        this.ownerDocument.addEventListener('babylon.init', this.#oninit as EventListener);
        this.ownerDocument.addEventListener('babylon.picked', this.#onpick as EventListener);
    }

    override disconnectedCallback(): void {
        this.button.removeEventListener('click', this.#onclick as EventListener);
        this.ownerDocument.removeEventListener('babylon.picked', this.#onpick as EventListener);
        this.ownerDocument.removeEventListener('babylon.init', this.#oninit as EventListener);
        this._mystuff = undefined;
        super.disconnectedCallback();
    }

    #oninit = () => {
        this.select.disabled = false;
        this.button.disabled = false;
        this.button.addEventListener('click', this.#onclick as EventListener);
    }

    #onpick = (e: PickEvent) => {
        if (!e.detail) return;
        const shape = e.detail.id.split('.')[0];
        this.select.value = shape;
    }

    #onclick = (_e: InputEvent) => {
        const shape = this.select.value; 
        if (!shape) return;
        this._mystuff!.createItem(shape);
    }
}