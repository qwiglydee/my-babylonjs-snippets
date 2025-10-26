import { PickingInfo } from "@babylonjs/core/Collisions";
import { BoundingBox } from "@babylonjs/core/Culling/boundingBox";
import { Plane, Vector3 } from "@babylonjs/core/Maths";
import { AbstractMesh } from "@babylonjs/core/Meshes/abstractMesh";
import type { Nullable } from "@babylonjs/core/types";

import type { BabylonElem } from "../context";
import { ShapeFactory } from "../factory";
import { BabylonController } from "./base";
import { assertNonNull } from "../utils/asserts";

export class DroppingController extends BabylonController {
    factory: ShapeFactory;
    ground: Plane = Plane.FromPositionAndNormal(Vector3.Zero(), Vector3.Up());
    bounds: Nullable<BoundingBox> = null;

    _ghost: Nullable<AbstractMesh> = null;
    _onground: boolean = false;

    constructor(host: BabylonElem, factory: ShapeFactory) {
        super(host);
        this.factory = factory;
    }

    init() {
        this.host.ondragenter = (e: DragEvent) => e.preventDefault();
        this.host.ondragleave = (e: DragEvent) => e.preventDefault();
        this.host.ondragover = (ev: DragEvent) => {
            ev.preventDefault();
            const poke = this._pokeEvent(ev);
            if (poke.hit && !this._onground) this._onenter(poke);
            if (poke.hit && this._onground) this._ondrag(poke);
            if (!poke.hit && this._onground) this._onleave(poke);
            this._onground = poke.hit;
        };
        this.host.ondrop = (ev: DragEvent) => {
            ev.preventDefault();
            const poke = this._pokeEvent(ev);
            if (poke.hit) this._ondrop(poke);
        };
        this.resize();
    }

    dispose() {
        this.host.ondragenter = null;
        this.host.ondragleave = null;
        this.host.ondragover = null;
        this.host.ondrop = null;
    }

    updating() {}

    update() {}

    resize() {
        this._rect = this.scene.getEngine().getRenderingCanvasClientRect() as DOMRect;
    }

    _rect!: DOMRect;

    _rayEvent(event: { clientX: number; clientY: number }) {
        const screenX = event.clientX - this._rect.left;
        const screenY = event.clientY - this._rect.top;
        return this.scene.createPickingRay(screenX, screenY, null, this.scene.activeCamera);
    }

    _pokeEvent(event: { clientX: number; clientY: number }): PickingInfo {
        const poke = new PickingInfo();
        poke.hit = false;
        poke.ray = this._rayEvent(event);

        if (poke.ray) {
            let dist = poke.ray.intersectsPlane(this.ground);
            poke.pickedPoint = dist ? poke.ray.origin.add(poke.ray.direction.scale(dist)) : null;
        }

        if (poke.pickedPoint) {
            poke.hit = this.bounds ? this.bounds.intersectsPoint(poke.pickedPoint) : true;
        }

        return poke;
    }

    _onenter(poke: PickingInfo) {
        const position = this.factory.validatePosition(poke.pickedPoint!);
        if (!this._ghost) this._ghost = this.factory.createGhost(position);
        else this.factory.moveGhost(this._ghost, position)
        this._ghost.setEnabled(true);
    }

    _onleave(_poke: PickingInfo) {
        if (this._ghost) this._ghost.setEnabled(false);
    }

    _ondrag(poke: PickingInfo) {
        assertNonNull(this._ghost);
        const position = this.factory.validatePosition(poke.pickedPoint!);
        if (position) this.factory.moveGhost(this._ghost, position);
    }

    _ondrop(poke: PickingInfo) {
        assertNonNull(this._ghost);
        this._ghost.dispose();
        const position = this.factory.validatePosition(poke.pickedPoint!);
        if (position) this.factory.createEntity(position);
    }
}
