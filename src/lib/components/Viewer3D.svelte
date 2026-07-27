<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { get } from 'svelte/store';
	import * as THREE from 'three';
	import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
	import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
	import { configuratorState, catalog, type ConfiguratorState } from '$lib/stores/configuratorStore';
	import { createBodyTexture } from '$lib/utils/gradientTexture';
	import { colors } from '$lib/theme';

	let canvasEl: HTMLCanvasElement;
	let containerEl: HTMLDivElement;

	let renderer: THREE.WebGLRenderer;
	let scene: THREE.Scene;
	let camera: THREE.PerspectiveCamera;
	let controls: OrbitControls;

	let potera: THREE.Group;

	// Raíz actualmente montada en `potera` (o bien el modelo real normalizado,
	// o bien el grupo procedural placeholder) + metadatos para saber cómo
	// liberar su memoria correctamente al reconstruir.
	let activeRoot: THREE.Object3D | null = null;
	let activeRootIsReal = false;

	// Meshes agrupados por zona personalizable, para poder aplicarles el
	// material correspondiente sin reconstruir toda la geometría.
	type Zone = 'cuerpo' | 'ojos' | 'plumas' | 'hardware';
	let zoneMeshes: Record<Zone, THREE.Mesh[]> = { cuerpo: [], ojos: [], plumas: [], hardware: [] };

	let modelLoading = $state(false);
	let usesRealModel = $state(false);

	let frameId: number;
	let renderToken = 0; // evita condiciones de carrera si el usuario cambia de forma rápido

	const gltfLoader = new GLTFLoader();
	const modelCache = new Map<string, THREE.Object3D>();

	async function loadRawModel(url: string): Promise<THREE.Object3D> {
		if (modelCache.has(url)) return modelCache.get(url)!;
		const gltf = await gltfLoader.loadAsync(url);
		modelCache.set(url, gltf.scene);
		return gltf.scene;
	}

	/**
	 * Clasifica un sub-mesh del modelo real en una zona personalizable según
	 * su nombre (definido por quien modela en Blender). Ver docs/CATALOG.md.
	 * Coincide con la convención observada en los modelos del fabricante:
	 * "Cuerpo", "Ojo d"/"Ojo i", "Pluma d"/"Pluma i", "Plomo", "Coronas", "Anilla".
	 */
	function classifyZone(name: string): Zone {
		const n = name.toLowerCase();
		if (n.includes('ojo')) return 'ojos';
		if (n.includes('pluma')) return 'plumas';
		if (n.includes('cuerpo')) return 'cuerpo';
		if (n.includes('plomo') || n.includes('corona') || n.includes('anilla') || n.includes('bezier')) {
			return 'hardware';
		}
		return 'cuerpo'; // fallback conservador: mejor pintable que invisible/gris
	}

	/** Centra y escala un objeto para que su dimensión mayor mida `targetSize`,
	 *  independientemente de las unidades/orientación con las que se modeló. */
	function normalizeToGroup(root: THREE.Object3D, targetSize: number): THREE.Group {
		const clone = root.clone(true);
		const box = new THREE.Box3().setFromObject(clone);
		const size = new THREE.Vector3();
		box.getSize(size);
		const center = new THREE.Vector3();
		box.getCenter(center);
		const maxDim = Math.max(size.x, size.y, size.z) || 1;

		clone.position.sub(center);
		const wrapper = new THREE.Group();
		wrapper.add(clone);
		wrapper.scale.setScalar(targetSize / maxDim);
		return wrapper;
	}

	function disposeActiveRoot() {
		if (!activeRoot) return;
		activeRoot.traverse((child) => {
			if (child instanceof THREE.Mesh) {
				// Los modelos reales comparten geometría con la caché (`modelCache`):
				// nunca liberarla. Los placeholders procedurales sí son únicos.
				if (!activeRootIsReal) child.geometry.dispose();
				const materials = Array.isArray(child.material) ? child.material : [child.material];
				materials.forEach((m) => {
					if (m instanceof THREE.MeshStandardMaterial && m.map) m.map.dispose();
					m.dispose();
				});
			}
		});
		potera.remove(activeRoot);
		activeRoot = null;
	}

	// --- Geometría placeholder por forma (fallback mientras no hay modelo3d) ---
	// NOTA: esta geometría procedural (LatheGeometry) es un SUSTITUTO temporal
	// del modelo 3D real. Se usa solo para formas que aún no tienen `modelo3d`
	// definido en shapes.json.
	function buildProceduralPotera(shapeId: string, scale: number): THREE.Group {
		const shape = catalog.shapes.find((s) => s.id === shapeId) ?? catalog.shapes[0];
		const group = new THREE.Group();

		const points = shape.perfil.map(
			(p) => new THREE.Vector2(Math.max(p.x, 0.001) * scale, p.y * scale)
		);
		const bodyMesh = new THREE.Mesh(
			new THREE.LatheGeometry(points, 32),
			new THREE.MeshStandardMaterial({ roughness: 0.55, metalness: 0.05 })
		);
		group.add(bodyMesh);
		zoneMeshes.cuerpo.push(bodyMesh);

		const eyeGeometry = new THREE.SphereGeometry(0.045 * scale, 12, 12);
		const eyeOffsetY = 0.55 * scale;
		const eyeOffsetX = 0.16 * scale;
		[-1, 1].forEach((side) => {
			const eye = new THREE.Mesh(
				eyeGeometry,
				new THREE.MeshStandardMaterial({ roughness: 0.2, metalness: 0.1 })
			);
			eye.position.set(side * eyeOffsetX, eyeOffsetY, 0);
			group.add(eye);
			zoneMeshes.ojos.push(eye);
		});

		const strandGeometry = new THREE.CylinderGeometry(0.006, 0.001, 0.5 * scale, 6);
		for (let i = 0; i < 5; i++) {
			const strand = new THREE.Mesh(
				strandGeometry,
				new THREE.MeshStandardMaterial({ roughness: 0.8 })
			);
			const angle = (i - 2) * 0.18;
			strand.position.set(0, 1.05 * scale + 0.22 * scale, 0);
			strand.rotation.z = angle;
			strand.rotation.x = Math.PI / 2.4;
			group.add(strand);
			zoneMeshes.plumas.push(strand);
		}

		return group;
	}

	async function rebuildPotera() {
		const myToken = ++renderToken;
		const state = get(configuratorState);
		const shape = catalog.shapes.find((s) => s.id === state.shapeId) ?? catalog.shapes[0];
		const size = catalog.sizes.find((s) => s.id === state.sizeId) ?? catalog.sizes[0];
		const scale = size.factorEscala;

		zoneMeshes = { cuerpo: [], ojos: [], plumas: [], hardware: [] };

		if (shape.modelo3d) {
			modelLoading = true;
			try {
				const raw = await loadRawModel(shape.modelo3d);
				if (myToken !== renderToken) return; // el usuario ya cambió de configuración

				const wrapper = normalizeToGroup(raw, 2 * scale);
				wrapper.traverse((child) => {
					if (child instanceof THREE.Mesh) {
						const zone = classifyZone(child.name);
						const isHardware = zone === 'hardware';
						child.material = new THREE.MeshStandardMaterial({
							roughness: isHardware ? 0.35 : 0.55,
							metalness: isHardware ? 0.85 : 0.05,
							color: isHardware ? '#c9ccd1' : '#ffffff'
						});
						zoneMeshes[zone].push(child);
					}
				});

				disposeActiveRoot();
				activeRoot = wrapper;
				activeRootIsReal = true;
				usesRealModel = true;
				potera.add(activeRoot);
			} catch (err) {
				console.error(`No se pudo cargar el modelo 3D (${shape.modelo3d}):`, err);
				if (myToken !== renderToken) return;
				disposeActiveRoot();
				activeRoot = buildProceduralPotera(state.shapeId, scale);
				activeRootIsReal = false;
				usesRealModel = false;
				potera.add(activeRoot);
			} finally {
				if (myToken === renderToken) modelLoading = false;
			}
		} else {
			disposeActiveRoot();
			activeRoot = buildProceduralPotera(state.shapeId, scale);
			activeRootIsReal = false;
			usesRealModel = false;
			potera.add(activeRoot);
		}

		applyMaterials(state);
	}

	function applyMaterials(state: ConfiguratorState) {
		const pattern =
			catalog.bodyPatterns.find((p) => p.id === state.bodyPatternId) ?? catalog.bodyPatterns[0];
		const eyeColor = catalog.eyeColors.find((c) => c.id === state.eyeColorId) ?? catalog.eyeColors[0];
		const featherColor =
			catalog.featherColors.find((c) => c.id === state.featherColorId) ?? catalog.featherColors[0];

		zoneMeshes.cuerpo.forEach((mesh) => {
			const mat = mesh.material as THREE.MeshStandardMaterial;
			mat.map?.dispose();
			mat.map = createBodyTexture(pattern.colores);
			mat.color.set('#ffffff');
			mat.needsUpdate = true;
		});
		zoneMeshes.ojos.forEach((mesh) => {
			(mesh.material as THREE.MeshStandardMaterial).color.set(eyeColor.colorHex);
		});
		zoneMeshes.plumas.forEach((mesh) => {
			(mesh.material as THREE.MeshStandardMaterial).color.set(featherColor.colorHex);
		});
		// Zona `hardware` (plomo/corona/anilla): acabado metálico fijo,
		// no personalizable por el usuario (ver CATALOG.md, pendiente confirmar
		// con el fabricante si esto debería cambiar en el futuro).
	}

	function handleResize() {
		if (!renderer || !camera || !containerEl) return;
		const { clientWidth, clientHeight } = containerEl;
		camera.aspect = clientWidth / clientHeight;
		camera.updateProjectionMatrix();
		renderer.setSize(clientWidth, clientHeight);
	}

	onMount(() => {
		scene = new THREE.Scene();
		scene.background = new THREE.Color(colors.ink);

		camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
		camera.position.set(0, 0, 3.2);

		renderer = new THREE.WebGLRenderer({ canvas: canvasEl, antialias: true, alpha: false });
		// Requisito de rendimiento móvil (ver ARCHITECTURE.md): limitar pixelRatio
		renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

		const hemiLight = new THREE.HemisphereLight(colors.foam, colors.inkSoft, 0.9);
		scene.add(hemiLight);
		const keyLight = new THREE.DirectionalLight(colors.foam, 1.1);
		keyLight.position.set(2, 3, 2);
		scene.add(keyLight);
		const rimLight = new THREE.DirectionalLight(colors.petrolLight, 0.6);
		rimLight.position.set(-2, -1, -2);
		scene.add(rimLight);

		potera = new THREE.Group();
		scene.add(potera);

		controls = new OrbitControls(camera, renderer.domElement);
		controls.enableDamping = true;
		controls.dampingFactor = 0.08;
		controls.enablePan = false;
		controls.minDistance = 1.6;
		controls.maxDistance = 6;

		rebuildPotera();
		handleResize();

		const animate = () => {
			frameId = requestAnimationFrame(animate);
			controls.update();
			renderer.render(scene, camera);
		};
		animate();

		const resizeObserver = new ResizeObserver(handleResize);
		resizeObserver.observe(containerEl);

		const unsubscribe = configuratorState.subscribe(() => {
			rebuildPotera();
		});

		return () => {
			resizeObserver.disconnect();
			unsubscribe();
		};
	});

	onDestroy(() => {
		if (frameId) cancelAnimationFrame(frameId);
		disposeActiveRoot();
		renderer?.dispose();
	});
</script>

<div class="viewer" bind:this={containerEl}>
	<canvas bind:this={canvasEl}></canvas>
	{#if modelLoading}
		<div class="loading">Cargando modelo 3D…</div>
	{/if}
	<p class="hint">
		Arrastra para girar en 360° · rueda/pellizco para zoom
		{#if usesRealModel}· modelo 3D real (WIP){/if}
	</p>
</div>

<style>
	.viewer {
		position: relative;
		width: 100%;
		height: 100%;
		border-radius: var(--radius-lg);
		overflow: hidden;
		background: var(--color-ink);
		border: 1px solid color-mix(in srgb, var(--color-petrol) 35%, transparent);
	}
	canvas {
		display: block;
		width: 100%;
		height: 100%;
		cursor: grab;
	}
	canvas:active {
		cursor: grabbing;
	}
	.loading {
		position: absolute;
		inset: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 0.85rem;
		color: var(--color-foam);
		background: color-mix(in srgb, var(--color-ink) 70%, transparent);
		pointer-events: none;
	}
	.hint {
		position: absolute;
		bottom: 12px;
		left: 50%;
		transform: translateX(-50%);
		margin: 0;
		padding: 6px 14px;
		font-size: 0.75rem;
		letter-spacing: 0.02em;
		color: var(--color-foam);
		background: color-mix(in srgb, var(--color-ink) 55%, transparent);
		border: 1px solid color-mix(in srgb, var(--color-petrol-light) 25%, transparent);
		border-radius: var(--radius-pill);
		backdrop-filter: blur(6px);
		pointer-events: none;
		white-space: nowrap;
	}
</style>
