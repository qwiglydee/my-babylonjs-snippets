import { createContext } from "@lit/context";

import type { PickingInfo } from "@babylonjs/core/Collisions/pickingInfo";
import type { BoundingBox } from "@babylonjs/core/Culling/boundingBox";
import type { Scene } from "@babylonjs/core/scene";
import type { Nullable } from "@babylonjs/core/types";

import type { MyScene } from "./scene";

export interface AppCtx {
    status: string;
    foo: string;
}

// NB: non nullable
export const appCtx = createContext<AppCtx>(Symbol('app'));


export interface SceneCtx {
    scene: MyScene;
    bounds: Nullable<BoundingBox>;
    world: Nullable<BoundingBox>;
}

export const sceneCtx = createContext<SceneCtx>(Symbol('babylon.scene'));

export const utilsCtx = createContext<Scene>(Symbol('babylon.utils'));

export const pickCtx = createContext<Nullable<PickingInfo>>(Symbol('babylon.pick'))

export interface PickDetail {
    mesh?: string;
    state?: string;
}
export type PickEvent = CustomEvent<PickDetail>;
