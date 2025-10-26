import { BackgroundMaterial, PBRMetallicRoughnessMaterial } from "@babylonjs/core/Materials";
import { Vector3 } from "@babylonjs/core/Maths";
import { Mesh, MeshBuilder } from "@babylonjs/core/Meshes";
import { AbstractMesh } from "@babylonjs/core/Meshes/abstractMesh";
import { Scene } from "@babylonjs/core/scene";

import type { ShapeParams } from "./context";

export class ShapeFactory {
    scene: Scene;
    utils: Scene;
    snapping: number = 0;

    label: string;
    shape: string;
    size: number;

    constructor(scene: Scene, utils: Scene, params: ShapeParams) {
        this.scene = scene; 
        this.utils = utils;
        this.label = params.label ?? "stuff";
        this.shape = params.shape;
        this.size = params.size ?? 1.0;
    }

    get entityMat() {
        let mat = this.scene.getMaterialByName("entity.mat")
        if (!mat) {
            mat = new PBRMetallicRoughnessMaterial("entity.mat", this.scene);
        }
        return mat;
    }

    get ghostMat() {
        let mat = this.scene.getMaterialByName("ghost.mat")
        if (!mat) {
            mat = new BackgroundMaterial("ghost.mat", this.scene);
            mat.wireframe = true;
            mat.alpha = 0.125;
        }
        return mat;
    }

    createMesh(scene: Scene, name: string): Mesh {
        switch (this.shape) {
            case 'box':
                return MeshBuilder.CreateBox(name, { size: this.size! }, scene);
            case 'ball':
                return MeshBuilder.CreateSphere(name, { diameter: this.size, segments: 6 }, scene);
            case 'diamond':
                return MeshBuilder.CreateIcoSphere(name, { radius: 0.5 * this.size, subdivisions: 1 }, scene);
            default:
                throw Error("Unknown shape");
        }
    }

    validatePosition(position: Vector3): Vector3 {
        if (this.snapping) {
            return new Vector3(
                Math.round(position.x / this.snapping) * this.snapping,
                Math.round(position.y / this.snapping) * this.snapping,
                Math.round(position.z / this.snapping) * this.snapping,
            )            
        } else {
            return position;
        }
    }

    createGhost(position: Vector3): Mesh {
        const mesh = this.createMesh(this.utils, `${this.label}.000`);
        mesh.material = this.ghostMat;
        mesh.position = position;
        return mesh;
    }

    createEntity(position: Vector3): Mesh {
        const idx = (this.scene.meshes.length + 1).toString().padStart(3, "0");
        const mesh = this.createMesh(this.scene, `${this.label}.${idx}`);
        mesh.material = this.entityMat;
        mesh.position = position;
        return mesh;
    }

    moveGhost(ghost: AbstractMesh, position: Vector3) {
        ghost.position = position;
    }
}