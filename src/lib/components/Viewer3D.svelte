<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { get } from 'svelte/store';
	import * as THREE from 'three';
	import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
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
	let bodyMesh: THREE.Mesh;
	let eyeMeshes: THREE.Mesh[] = [];
	let featherGroup: THREE.Group;

	let frameId: number;

	// --- Construcción de la geometría placeholder por forma ---
	// NOTA: esta geometría procedural (LatheGeometry) es un SUSTITUTO temporal
	// del modelo 3D real (.glb) que se definirá en la Fase 3 (ver ROADMAP.md).
	// Sirve para validar el pipeline completo: cambio de forma, escala por
	// tamaño y materiales independientes por zona (cuerpo/ojos/plumas).
	function buildBodyGeometry(shapeId: string, scale: number): THREE.BufferGeometry {
		const shape = catalog.shapes.find((s) => s.id === shapeId) ?? catalog.shapes[0];
		const points = shape.perfil.map(
			(p) => new THREE.Vector2(Math.max(p.x, 0.001) * scale, p.y * scale)
		);
		return new THREE.LatheGeometry(points, 32);
	}

	function disposeMesh(mesh: THREE.Mesh) {
		mesh.geometry.dispose();
		if (Array.isArray(mesh.material)) {
			mesh.material.forEach((m) => m.dispose());
		} else {
			mesh.material.dispose();
		}
	}

	function rebuildPotera() {
		const state = get(configuratorState);
		const size = catalog.sizes.find((s) => s.id === state.sizeId) ?? catalog.sizes[0];
		const scale = size.factorEscala;

		// Cuerpo
		if (bodyMesh) {
			potera.remove(bodyMesh);
			disposeMesh(bodyMesh);
		}
		const geometry = buildBodyGeometry(state.shapeId, scale);
		const bodyMaterial = new THREE.MeshStandardMaterial({ roughness: 0.55, metalness: 0.05 });
		bodyMesh = new THREE.Mesh(geometry, bodyMaterial);
		bodyMesh.name = 'cuerpo';
		potera.add(bodyMesh);

		// Ojos (dos esferas simétricas cerca de la zona "frontal")
		eyeMeshes.forEach((m) => {
			potera.remove(m);
			disposeMesh(m);
		});
		eyeMeshes = [];
		const eyeGeometry = new THREE.SphereGeometry(0.045 * scale, 12, 12);
		const eyeOffsetY = 0.55 * scale;
		const eyeOffsetX = 0.16 * scale;
		[-1, 1].forEach((side) => {
			const eyeMaterial = new THREE.MeshStandardMaterial({ roughness: 0.2, metalness: 0.1 });
			const eye = new THREE.Mesh(eyeGeometry, eyeMaterial);
			eye.position.set(side * eyeOffsetX, eyeOffsetY, 0);
			eye.name = 'ojo';
			potera.add(eye);
			eyeMeshes.push(eye);
		});

		// Plumas (representadas como finos cilindros abiertos hacia la "boca")
		if (featherGroup) {
			potera.remove(featherGroup);
			featherGroup.traverse((child) => {
				if (child instanceof THREE.Mesh) disposeMesh(child);
			});
		}
		featherGroup = new THREE.Group();
		featherGroup.name = 'plumas';
		const featherMaterial = new THREE.MeshStandardMaterial({ roughness: 0.8 });
		const strandGeometry = new THREE.CylinderGeometry(0.006, 0.001, 0.5 * scale, 6);
		for (let i = 0; i < 5; i++) {
			const strand = new THREE.Mesh(strandGeometry, featherMaterial.clone());
			const angle = (i - 2) * 0.18;
			strand.position.set(0, 1.05 * scale + 0.22 * scale, 0);
			strand.rotation.z = angle;
			strand.rotation.x = Math.PI / 2.4;
			featherGroup.add(strand);
		}
		potera.add(featherGroup);

		applyMaterials(state);
	}

	function applyMaterials(state: ConfiguratorState) {
		const pattern =
			catalog.bodyPatterns.find((p) => p.id === state.bodyPatternId) ?? catalog.bodyPatterns[0];
		const eyeColor = catalog.eyeColors.find((c) => c.id === state.eyeColorId) ?? catalog.eyeColors[0];
		const featherColor =
			catalog.featherColors.find((c) => c.id === state.featherColorId) ?? catalog.featherColors[0];

		if (bodyMesh) {
			const mat = bodyMesh.material as THREE.MeshStandardMaterial;
			mat.map?.dispose();
			mat.map = createBodyTexture(pattern.colores);
			mat.color.set('#ffffff');
			mat.needsUpdate = true;
		}
		eyeMeshes.forEach((eye) => {
			(eye.material as THREE.MeshStandardMaterial).color.set(eyeColor.colorHex);
		});
		featherGroup?.traverse((child) => {
			if (child instanceof THREE.Mesh) {
				(child.material as THREE.MeshStandardMaterial).color.set(featherColor.colorHex);
			}
		});
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
		if (bodyMesh) disposeMesh(bodyMesh);
		eyeMeshes.forEach(disposeMesh);
		renderer?.dispose();
	});
</script>

<div class="viewer" bind:this={containerEl}>
	<canvas bind:this={canvasEl}></canvas>
	<p class="hint">Arrastra para girar en 360° · rueda/pellizco para zoom</p>
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
	}
</style>
