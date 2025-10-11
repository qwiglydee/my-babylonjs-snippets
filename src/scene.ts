import type { Engine } from "@babylonjs/core/Engines/engine";
import type { AbstractMesh } from "@babylonjs/core/Meshes/abstractMesh";
import type { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import { Observable } from "@babylonjs/core/Misc/observable";
import { Tags } from "@babylonjs/core/Misc/tags";
import { Scene, type SceneOptions } from "@babylonjs/core/scene";


const SCNOPTIONS: SceneOptions = {};


export class MyScene extends Scene {
    // observe when something added/removed or moved around
    onModelUpdatedObservable: Observable<AbstractMesh[]> = new Observable();

    constructor(engine: Engine) {
        super(engine, SCNOPTIONS);
        this.onNewMeshAddedObservable.add((mesh: AbstractMesh) => this.onModelUpdatedObservable.notifyObservers([mesh]));
        this.onMeshRemovedObservable.add((mesh: AbstractMesh) => this.onModelUpdatedObservable.notifyObservers([mesh]));
    }

    markAux(node: TransformNode) {
        Tags.AddTagsTo(node, "aux");
    }
    
    #nonAuxFilter = (n: TransformNode) => Tags.MatchesQuery(n, "!aux");

    getModelExtends() {
        return this.getWorldExtends(this.#nonAuxFilter);
    }
}