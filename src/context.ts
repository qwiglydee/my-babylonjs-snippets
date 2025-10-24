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


export interface SceneCtx {
    scene: MyScene;
    bounds: Nullable<BoundingBox>;
    world: Nullable<BoundingBox>;
}

export const sceneCtx = createContext<SceneCtx>(Symbol('babylon.scene'));

export const utilsCtx = createContext<Scene>(Symbol('babylon.utils'));

export const pickCtx = createContext<Nullable<PickingInfo>>(Symbol('babylon.pick'))

export interface BabylonElem extends ReactiveElement {
    ctx: SceneCtx;
    utils: Scene;
    pick: Nullable<PickingInfo>;
}

