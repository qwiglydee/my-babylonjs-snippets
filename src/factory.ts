import { BackgroundMaterial, PBRMetallicRoughnessMaterial } from "@babylonjs/core/Materials";
import { Mesh, MeshBuilder } from "@babylonjs/core/Meshes";
import type { Vector3 } from "@babylonjs/core/Maths";
import type { ShapeParams } from "./context";
import type { MyScene } from "./scene";


export class ShapeFactory {
    scene: MyScene;

    label: string;
    shape: string;
    size: number;

    constructor(scene: MyScene, params: ShapeParams) {
        this.scene = scene; 
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

    createMesh(): Mesh {
        const idx = (this.scene.getModelMeshes().length + 1).toString().padStart(3, "0");
        const name = `${this.label}.${idx}`
        switch (this.shape) {
            case 'box':
                return MeshBuilder.CreateBox(name, { size: this.size! }, this.scene);
            case 'ball':
                return MeshBuilder.CreateSphere(name, { diameter: this.size, segments: 6 }, this.scene);
            case 'diamond':
                return MeshBuilder.CreateIcoSphere(name, { radius: 0.5 * this.size, subdivisions: 1 }, this.scene);
            default:
                throw Error("Unknown shape");
        }
    }

    createGhost(position: Vector3): Mesh {
        const mesh = this.createMesh();
        mesh.material = this.ghostMat;
        mesh.position = position;
        return mesh;
    }

    createEntity(position: Vector3): Mesh {
        const mesh = this.createMesh();
        mesh.material = this.entityMat;
        mesh.position = position;
        return mesh;
    }
}