<script lang="ts">
	import { onMount } from 'svelte';
	import ConfiguratorPanel from '$lib/components/ConfiguratorPanel.svelte';
	import type { Component } from 'svelte';

	// Carga diferida del visualizador 3D: Three.js es la parte más pesada del
	// bundle (~140KB gzip). Separarlo en un chunk aparte, cargado solo tras el
	// primer render, evita que bloquee la carga inicial de la página —
	// especialmente importante en móviles de gama media/baja (ver
	// docs/ARCHITECTURE.md, sección de rendimiento).
	let Viewer3D: Component | null = $state(null);

	onMount(async () => {
		const mod = await import('$lib/components/Viewer3D.svelte');
		Viewer3D = mod.default;
	});
</script>

<svelte:head>
	<title>Poteras Artesanales Riotinta — Configurador</title>
</svelte:head>

<main>
	<div class="panel-col">
		<ConfiguratorPanel />
	</div>
	<div class="viewer-col">
		{#if Viewer3D}
			<Viewer3D />
		{:else}
			<div class="viewer-loading" role="status" aria-live="polite">
				<span class="spinner"></span>
				<p>Cargando visualizador 3D…</p>
			</div>
		{/if}
	</div>
</main>

<style>
	main {
		display: grid;
		grid-template-columns: 340px 1fr;
		gap: 1.25rem;
		height: 100vh;
		padding: 1.25rem;
		box-sizing: border-box;
		background: var(--color-ink);
	}
	.panel-col,
	.viewer-col {
		min-height: 0;
	}
	.viewer-loading {
		height: 100%;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 0.75rem;
		border-radius: var(--radius-lg);
		background: var(--color-ink);
		border: 1px solid color-mix(in srgb, var(--color-petrol) 35%, transparent);
		color: var(--color-foam-dim);
		font-size: 0.85rem;
	}
	.spinner {
		width: 28px;
		height: 28px;
		border-radius: 50%;
		border: 3px solid color-mix(in srgb, var(--color-petrol-light) 30%, transparent);
		border-top-color: var(--color-petrol-light);
		animation: spin 0.8s linear infinite;
	}
	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}
	@media (max-width: 780px) {
		main {
			grid-template-columns: 1fr;
			grid-template-rows: auto 55vh;
			height: auto;
			min-height: 100vh;
		}
	}
</style>
