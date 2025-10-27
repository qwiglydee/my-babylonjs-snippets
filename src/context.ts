import type { ReactiveElement } from "lit";
import { createContext } from "@lit/context";

/**** main app ****/

export interface AppCtx {
    status: string;
    foo: string;
}

export const appCtx = createContext<AppCtx>(Symbol('app'));

export interface AppElement {
    ctx: AppCtx;
    dragging: Nullable<ShapeParams>;
}

/**** shared  ****/

export interface PickDetail {
    mesh?: string;
    state?: string;
}

export type PickEvent = CustomEvent<PickDetail>;


export interface ShapeParams {
    label?: string;
    shape: "box" | "ball" | "diamond";
    size?: number;
}

export const draggingCtx = createContext<Nullable<ShapeParams>>(Symbol('app.dragging'))

/**** babylon stuff ****/

import type { PickingInfo } from "@babylonjs/core/Collisions/pickingInfo";
import type { BoundingBox } from "@babylonjs/core/Culling/boundingBox";
import type { Scene } from "@babylonjs/core/scene";
import type { Nullable } from "@babylonjs/core/types";

import type { MyScene } from "./scene";


export const sceneCtx = createContext<Scene>(Symbol('babylon.scene'));

export const pickCtx = createContext<Nullable<PickingInfo>>(Symbol('babylon.pick'))

export interface ModelCtx {
    scene: MyScene; // the root scene
    bounds: Nullable<BoundingBox>;
    world: Nullable<BoundingBox>;
    // parts, actions, etc
}

export const modelCtx = createContext<ModelCtx>(Symbol('babylon.model'));

export interface BabylonElem extends ReactiveElement {
    scene: MyScene;
    model: ModelCtx
    pick: Nullable<PickingInfo>;
    dragdata: Nullable<ShapeParams>;
}

