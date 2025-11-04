import { type ReactiveElement } from "lit";

export const WithoutShadow = (origClass: typeof ReactiveElement) => class extends origClass {
    protected override createRenderRoot(): HTMLElement {
        return this;
    }
}