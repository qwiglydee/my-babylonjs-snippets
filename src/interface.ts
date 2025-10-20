import type { ReactiveElement } from "lit";
import type { Nullable } from "@babylonjs/core/types";
import type { Mesh } from "@babylonjs/core/Meshes/mesh";
import type { MyScene } from "./scene";


export interface BabylonElement extends HTMLElement, ReactiveElement {
    scene: MyScene;
    selected: Nullable<Mesh>;
}