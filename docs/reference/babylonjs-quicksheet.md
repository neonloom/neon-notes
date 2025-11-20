---
title: Babylon.js Quick Reference
summary: LLM-friendly Babylon.js API and task scaffolds for rapid scene prototyping.
tags: [babylonjs, graphics, reference]
updated: 2025-03-06
audience: both
---

# Babylon.js Quick Reference

> **Context Card**
> - **Scope:** Core Babylon.js APIs, defaults, and code scaffolds tuned for agent-assisted generation.
> - **Primary APIs:** `BABYLON.Engine`, `Scene`, `MeshBuilder`, `SceneLoader`, `ArcRotateCamera`, `PBRMaterial`, `Animation`.
> - **Platforms:** Web (DOM canvas), bundlers, Node/WebXR via progressive enhancement.
> - **Dependencies:** Babylon.js core (`@babylonjs/core` or CDN bundle), optional GUI, physics plugins, HDR assets.
> - **Next Hop:** Babylon.js docs (https://doc.babylonjs.com/), GUI docs (https://doc.babylonjs.com/features/featuresDeepDive/gui/gui).

This sheet compresses the Babylon.js surface most projects reach for first: stable namespaces, concise signatures with defaults, and “task blocks” that translate common intents into minimal code. It is not exhaustive—focus remains on the 20 % of APIs used 80 % of the time.

---

## Conventions

* **Types:** `number | string | boolean | Vector3 | Color3 | Color4 | Matrix | Quaternion | Observable<T> | Promise<T>`
* **Opt args:** `[arg]?`, defaults in `(= default)`.
* **Return:** last item in signature.
* **Side effects:** `// side`.
* All creation functions return the created object; pass an optional `name` last when relevant.

---

## 1) Core

### Engine

* `new BABYLON.Engine(canvas: HTMLCanvasElement, antialias (= true), engineOptions (= {})) -> Engine`
* `engine.runRenderLoop(cb: () => void) // side`
* `engine.resize() // side`
* `engine.dispose()`

### Scene

* `new BABYLON.Scene(engine: Engine, options (= {})) -> Scene`
* `scene.render() // side`
* `scene.createDefaultCameraOrLight(createArcRotateCamera (= true), replace (= true), attachControl (= true)) // side`
* `scene.createDefaultEnvironment(opts (= {})) -> EnvironmentHelper`
* `scene.onPointerObservable: Observable<PointerInfo>`
* `scene.onBeforeRenderObservable: Observable<Scene>`
* `scene.onAfterRenderObservable: Observable<Scene>`

### Node Graph

* `new BABYLON.TransformNode(name, scene) -> TransformNode`
* `node.parent = otherNode // side`
* `node.position: Vector3` `node.rotation: Vector3` `node.rotationQuaternion?: Quaternion` `node.scaling: Vector3`
* `node.getChildMeshes(deep (= true)) -> AbstractMesh[]`

---

## 2) Geometry & Meshes

### Primitives

* `BABYLON.MeshBuilder.CreateBox(name, { size (=1), ... }, scene) -> Mesh`
* `...CreateSphere(name, { diameter, segments }, scene) -> Mesh`
* `...CreateGround(name, { width, height, subdivisions }, scene) -> Mesh`
* `...CreatePlane(name, { size | width,height }, scene) -> Mesh`
* `...CreateCylinder, CreateTorus, CreateLines, CreatePolygon, CreateTube, CreateIcoSphere, CreateCapsule -> Mesh`

### Mesh Ops

* `mesh.material = material // side`
* `mesh.enableEdgesRendering(edgeWidth (= 1), color (= Color4(1,1,1,1))) // side`
* `mesh.receiveShadows = boolean`
* `mesh.isPickable = boolean`
* `mesh.checkCollisions = boolean`
* `mesh.applyDisplacementMap(url, min, max, onSuccess?) -> Promise<void>`
* `mesh.bakeCurrentTransformIntoVertices() // side`

---

## 3) Materials, Textures, Skybox

### Colors/Math

* `new BABYLON.Color3(r,g,b)` `Color3.FromHexString("#rrggbb")`
* `new BABYLON.Color4(r,g,b,a)`
* `new BABYLON.Vector3(x,y,z)` `BABYLON.Vector3.Zero()` `Vector3.Up()` `Vector3.Forward()`

### Standard Materials

* `new BABYLON.StandardMaterial(name, scene) -> StandardMaterial`

  * `mat.diffuseColor: Color3` `mat.specularColor: Color3` `mat.emissiveColor: Color3`
  * `mat.diffuseTexture = new Texture(url, scene)`
* `new BABYLON.PBRMaterial(name, scene) -> PBRMaterial`

  * `mat.albedoColor: Color3` `mat.metallic: number` `mat.roughness: number`
  * `mat.albedoTexture = new Texture(url, scene)` `mat.metallicTexture = new Texture(url, scene)` etc.

### Textures & Cubemaps

* `new BABYLON.Texture(url, scene, noMipmap (= false), invertY (= false)) -> Texture`
* `BABYLON.CubeTexture.CreateFromPrefilteredData(url, scene) -> CubeTexture`

### Environment

* `scene.createDefaultEnvironment({ createSkybox (= true), skyboxSize (= 1000), environmentTexture? }) -> EnvironmentHelper`

---

## 4) Cameras

### ArcRotate (orbit)

* `new BABYLON.ArcRotateCamera(name, alpha, beta, radius, target: Vector3, scene) -> ArcRotateCamera`
* `camera.attachControl(canvas, useCtrlForPanning (= true)) // side`
* Props: `lowerRadiusLimit`, `upperRadiusLimit`, `wheelPrecision`, `panningSensibility`

### Free/Universal (FPS)

* `new BABYLON.UniversalCamera(name, position: Vector3, scene) -> UniversalCamera`
* `camera.keysUp/Down/Left/Right = [W,S,A,D] // side`
* `camera.attachControl(canvas, true)`

### Follow/Target

* `new BABYLON.FollowCamera(name, position, scene) -> FollowCamera`
* `camera.lockedTarget = mesh`

---

## 5) Lights & Shadows

### Lights

* `new BABYLON.HemisphericLight(name, direction: Vector3, scene) -> HemisphericLight` (ambient)
* `new BABYLON.DirectionalLight(name, direction: Vector3, scene) -> DirectionalLight`
* `new BABYLON.PointLight(name, position: Vector3, scene) -> PointLight`
* `new BABYLON.SpotLight(name, position, direction, angle, exponent, scene) -> SpotLight`

### Shadows

* `new BABYLON.ShadowGenerator(mapSize: number, light: IShadowLight) -> ShadowGenerator`
* `shadows.addShadowCaster(mesh, includeDescendants (= true)) // side`
* `mesh.receiveShadows = true // side`

---

## 6) Loading & Assets

### SceneLoader (glTF/GLB/OBJ/…)

* `BABYLON.SceneLoader.Append(rootUrl, fileName, scene, onSuccess?) -> Promise<Scene>`
* `BABYLON.SceneLoader.ImportMesh(meshesToImport (= ""), rootUrl, fileName, scene, onSuccess?) -> Promise<AbstractMesh[]>`
* `BABYLON.SceneLoader.LoadAssetContainer(rootUrl, fileName, scene, onSuccess?) -> Promise<AssetContainer>`

### AssetManager (batch)

* `new BABYLON.AssetsManager(scene) -> AssetsManager`
* `manager.addMeshTask(name, meshes, root, file) -> MeshAssetTask`
* `task.onSuccess = (t)=>{}; task.onError = (t,msg)=>{}`
* `manager.load() -> void` (`manager.onFinish = ()=>{}`)

---

## 7) Animation

* `new BABYLON.Animation(name, targetProperty: string, frameRate, type: Animation.ANIMATIONTYPE_xxx, loopMode, enableBlending) -> Animation`
* `animation.setKeys([{ frame: number, value: any }]) // side`
* `scene.beginDirectAnimation(target, [animation], from, to, loop (= true), speedRatio (= 1.0)) -> Animatable`
* `BABYLON.Animation.CreateAndStartAnimation(name, target, property, fps, totalFrames, from, to, loop) -> Animatable`
* `BABYLON.AnimationGroup`:

  * `group = new BABYLON.AnimationGroup(name)`; `group.addTargetedAnimation(anim, target)`; `group.play(loop)`

---

## 8) Physics (v2 interface)

* `BABYLON.PhysicsAggregate` (simple) or `BABYLON.PhysicsBody` + `PhysicsShape` (advanced)
* `scene.enablePhysics(gravity = new Vector3(0,-9.81,0), new BABYLON.CannonJSPlugin() | AmmoJSPlugin | HavokPlugin)` *(plugin script must be loaded)*
* `new BABYLON.PhysicsAggregate(mesh, shapeType, { mass, restitution, friction }, scene)` -> PhysicsAggregate
* Impulses:

  * `mesh.physicsBody.applyImpulse(force: Vector3, contactPoint: Vector3)`

---

## 9) Particles & FX

* `new BABYLON.ParticleSystem(name, capacity, scene) -> ParticleSystem`
* `system.particleTexture = new Texture(url, scene)`
* `system.emitter = Vector3 | Mesh`
* `system.start()` / `system.stop()`

### Post-Processing & Pipelines

* `new BABYLON.DefaultRenderingPipeline(name, hdr (= true), scene, cameras?) -> DefaultRenderingPipeline`
* Toggles: `pipeline.bloomEnabled`, `imageProcessingEnabled`, `sharpenEnabled`, `fxaaEnabled`
* `new BABYLON.PostProcess(name, fragmentUrl, uniforms, samplers, ratio, camera) -> PostProcess`

---

## 10) Input, Actions, Observables

* Picking:

  * `scene.pick(x, y) -> PickingInfo`
  * `scene.onPointerObservable.add((pi)=>{})` with `pi.type` in `PointerEventTypes`
* Actions:

  * `new BABYLON.ActionManager(scene)`; `mesh.actionManager = new ActionManager(scene)`
  * `OnPickTrigger`, `OnIntersectionEnterTrigger`, etc.
* Observables:

  * `observable.add(cb)`; `observable.remove(cb)`; `observable.clear()`

---

## 11) GUI (Babylon GUI 2D/3D)

* `const gui = BABYLON.GUI.AdvancedDynamicTexture.CreateFullscreenUI(name)`
* `const btn = BABYLON.GUI.Button.CreateSimpleButton(name, text)`
* `btn.width = "180px"; btn.height = "40px"; btn.onPointerUpObservable.add(()=>{})`
* 3D GUI:

  * `const ui3d = new BABYLON.GUI.GUI3DManager(scene)`
  * `const panel = new BABYLON.GUI.StackPanel3D()`; `ui3d.addControl(panel)`
  * `panel.addControl(new BABYLON.GUI.HolographicButton(name))`

---

## 12) XR

* `const xr = await scene.createDefaultXRExperienceAsync({ floorMeshes?, disableTeleportation? }) -> WebXRDefaultExperience`
* `xr.baseExperience.enterXRAsync()` / `exitXRAsync()`
* `xr.input.onControllerAddedObservable.add((controller)=>{})`
* Teleportation options via `xr.teleportation` feature (if enabled).

---

## 13) Utilities & Debug

* `BABYLON.Tools.ToRadians(deg)` / `ToDegrees(rad)`
* `mesh.showBoundingBox = true` `mesh.computeWorldMatrix(true)`
* `scene.debugLayer.show({ embedMode (= true) })` *(Inspector)*
* Gizmos:

  * `const gizmos = new BABYLON.GizmoManager(scene); gizmos.positionGizmoEnabled = true; gizmos.attachToMesh(mesh)`

---

## 14) Serialization

* `const json = BABYLON.SceneSerializer.Serialize(scene) -> any`
* `BABYLON.SceneLoader.Append("", "", scene, null, ".babylon", null, null, data = json) // rehydrate`
* `mesh.serialize() -> any`

---

# Task Blocks (Prompt → Minimal Code)

> **Goal:** deterministic scaffolds that agents can slot values into.

### A) Bootstrap scene

```js
function makeScene(canvasId) {
  const canvas = document.getElementById(canvasId);
  const engine = new BABYLON.Engine(canvas, true);
  const scene  = new BABYLON.Scene(engine);
  scene.createDefaultCameraOrLight(true, true, true);
  scene.createDefaultEnvironment({});
  engine.runRenderLoop(() => scene.render());
  window.addEventListener('resize', () => engine.resize());
  return { engine, scene };
}
```

### B) Load a GLB/GLTF and center it

```js
async function loadModel(scene, url) {
  const result = await BABYLON.SceneLoader.ImportMesh("", "", url, scene);
  const meshes = result; // array
  const root = new BABYLON.TransformNode("modelRoot", scene);
  meshes.forEach(m => m.parent = root);
  root.position = BABYLON.Vector3.Zero();
  return root;
}
```

### C) Add PBR + texture

```js
function pbr(scene, { color = "#ffffff", metallic = 0.5, roughness = 0.5, albedoUrl = null }, name="pbr") {
  const mat = new BABYLON.PBRMaterial(name, scene);
  mat.albedoColor = BABYLON.Color3.FromHexString(color);
  mat.metallic = metallic;
  mat.roughness = roughness;
  if (albedoUrl) mat.albedoTexture = new BABYLON.Texture(albedoUrl, scene);
  return mat;
}
```

### D) Shadowed sun + ground

```js
function sunAndShadows(scene, casterMeshes = []) {
  const light = new BABYLON.DirectionalLight("sun", new BABYLON.Vector3(-1,-2,-1), scene);
  const sg = new BABYLON.ShadowGenerator(2048, light);
  casterMeshes.forEach(m => sg.addShadowCaster(m, true));
  const ground = BABYLON.MeshBuilder.CreateGround("ground", { width: 50, height: 50 }, scene);
  ground.receiveShadows = true;
  return { light, sg, ground };
}
```

### E) Orbit camera focusing target

```js
function orbit(scene, target, radius=5) {
  const cam = new BABYLON.ArcRotateCamera("cam", Math.PI/2, Math.PI/3, radius, target, scene);
  cam.attachControl(scene.getEngine().getRenderingCanvas(), true);
  cam.lowerRadiusLimit = 1; cam.upperRadiusLimit = 100;
  return cam;
}
```

### F) Create a simple keyframe animation

```js
function animateY(node, from=0, to=2, fps=60, total=60, loop=true) {
  const anim = new BABYLON.Animation("yHop", "position.y", fps,
    BABYLON.Animation.ANIMATIONTYPE_FLOAT, BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE);
  anim.setKeys([{ frame: 0, value: from }, { frame: total, value: to }]);
  return scene.beginDirectAnimation(node, [anim], 0, total, loop);
}
```

### G) Ray pick on click

```js
function onPick(scene, cb /* (hit: PickingInfo) => void */) {
  scene.onPointerObservable.add(pi => {
    if (pi.type === BABYLON.PointerEventTypes.POINTERPICK) cb(pi.pickInfo);
  });
}
```

### H) Physics quick start (CannonJS)

```js
async function physicsStart(scene) {
  // ensure Cannon script loaded separately
  scene.enablePhysics(new BABYLON.Vector3(0,-9.81,0), new BABYLON.CannonJSPlugin());
}
function makeRigid(scene, mesh, mass=1) {
  return new BABYLON.PhysicsAggregate(mesh, BABYLON.PhysicsShapeType.BOX, { mass, restitution: 0.2, friction: 0.8 }, scene);
}
```

### I) Fullscreen GUI button

```js
function button(scene, text, onClick) {
  const ui = BABYLON.GUI.AdvancedDynamicTexture.CreateFullscreenUI("ui");
  const btn = BABYLON.GUI.Button.CreateSimpleButton("btn", text);
  btn.width="200px"; btn.height="50px";
  btn.onPointerUpObservable.add(onClick);
  ui.addControl(btn);
  return btn;
}
```

### J) WebXR default experience

```js
async function xrStart(scene) {
  const xr = await scene.createDefaultXRExperienceAsync({ disableTeleportation: false });
  return xr;
}
```

---

# Gotchas & Defaults (for Agents)

* **Right-handed vs left-handed:** Babylon is **left-handed** by default (Z forward). Don’t mix coordinate systems from other engines without conversion.
* **Units:** No fixed unit; be consistent (treat 1 unit = 1 meter).
* **Materials:** PBR looks best with environment texture (`scene.createDefaultEnvironment`). If your model looks dark, add environment.
* **Textures:** For GLTF/GLB, `invertY` on textures is usually **false** by default; for manual `Texture`, leave `invertY=false` unless you see flips.
* **Animation FPS:** Common is `60`. Keyframes are frame indices, not seconds.
* **Physics:** Load a physics plugin script before enabling. Shapes: pick matching primitive or `MESH` for concave (heavier).
* **Shadows:** Only meshes added to `ShadowGenerator` cast. Receivers must set `receiveShadows=true`.
* **Disposal:** Call `dispose()` on materials/meshes/textures when replacing at runtime to avoid leaks.
* **Pickability:** `mesh.isPickable=false` excludes it from ray picking—useful for skyboxes/grounds.

---

# Minimal Scene Template (single function)

```js
async function main(canvasId, modelUrl=null) {
  const { engine, scene } = makeScene(canvasId);
  const hemi = new BABYLON.HemisphericLight("hemi", new BABYLON.Vector3(0,1,0), scene);
  const ground = BABYLON.MeshBuilder.CreateGround("ground", { width: 30, height: 30 }, scene);
  let focus = ground;
  if (modelUrl) {
    const root = await loadModel(scene, modelUrl);
    const { light, sg } = sunAndShadows(scene, root.getChildMeshes(true));
    focus = root;
  }
  orbit(scene, focus.getAbsolutePosition?.() ?? BABYLON.Vector3.Zero(), 6);
  return { engine, scene };
}
```

---

# Capability Matrix (quick reference)

| Capability       | Primary APIs                              |
| ---------------- | ----------------------------------------- |
| Init + loop      | `Engine`, `Scene`, `runRenderLoop`        |
| Orbit camera     | `ArcRotateCamera.attachControl`           |
| Import GLB       | `SceneLoader.ImportMesh/Append`           |
| PBR look         | `PBRMaterial`, `createDefaultEnvironment` |
| Lights & shadows | `DirectionalLight`, `ShadowGenerator`     |
| Click picking    | `scene.pick`, `onPointerObservable`       |
| Keyframe anim    | `Animation`, `beginDirectAnimation`       |
| GUI button       | `GUI.AdvancedDynamicTexture`, `Button`    |
| Physics          | `enablePhysics`, `PhysicsAggregate`       |
| PostFX           | `DefaultRenderingPipeline`, `PostProcess` |
| XR               | `createDefaultXRExperienceAsync`          |
| Serialize        | `SceneSerializer.Serialize`               |

---

Need more structure? Consider lifting these helpers into a reusable `tools/graphics/babylon/` module or composing them with your FRP/DAG utilities so agents can import instead of copy-paste.
