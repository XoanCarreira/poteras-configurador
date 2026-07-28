<script lang="ts">
	import { configuratorState, catalog } from '$lib/stores/configuratorStore';

	function gradientCss(colors: string[]): string {
		if (colors.length === 1) return colors[0];
		return `linear-gradient(180deg, ${colors.join(', ')})`;
	}

	function eyeSwatchCss(eye: { colorHex: string; tipo?: string; colores?: [string, string] }): string {
		if (eye.tipo === 'radial' && eye.colores) {
			return `radial-gradient(circle at 35% 35%, ${eye.colores[0]}, ${eye.colores[1]})`;
		}
		return eye.colorHex;
	}
</script>

<aside class="panel">
	<header>
		<img class="logo" src="/brand/logo-riotinta.png" alt="Poteras Artesanales Riotinta" />
		<span class="eyebrow">Configurador</span>
		<h1>Deseña a túa poteira</h1>
	</header>

	<section>
		<h2>Forma</h2>
		<div class="row">
			{#each catalog.shapes as shape}
				<button
					class="chip"
					class:active={$configuratorState.shapeId === shape.id}
					onclick={() => ($configuratorState.shapeId = shape.id)}
					title={shape.descripcion}
				>
					{shape.nombre}
				</button>
			{/each}
		</div>
	</section>

	<section>
		<h2>Tamaño</h2>
		<div class="row">
			{#each catalog.sizes as size}
				<button
					class="chip chip--size"
					class:active={$configuratorState.sizeId === size.id}
					onclick={() => ($configuratorState.sizeId = size.id)}
				>
					{size.nombre}
				</button>
			{/each}
		</div>
	</section>

	<section>
		<h2>Patrón do corpo</h2>
		<div class="swatch-grid">
			{#each catalog.bodyPatterns as pattern}
				<button
					class="swatch"
					class:active={$configuratorState.bodyPatternId === pattern.id}
					style:background={gradientCss(pattern.colores)}
					onclick={() => ($configuratorState.bodyPatternId = pattern.id)}
					title={pattern.nombre}
					aria-label={pattern.nombre}
				></button>
			{/each}
		</div>
	</section>

	<section>
		<h2>Cor de ollos</h2>
		<div class="swatch-grid swatch-grid--small">
			{#each catalog.eyeColors as eye}
				<button
					class="swatch swatch--small"
					class:active={$configuratorState.eyeColorId === eye.id}
					style:background={eyeSwatchCss(eye)}
					onclick={() => ($configuratorState.eyeColorId = eye.id)}
					title={eye.nombre}
					aria-label={eye.nombre}
				></button>
			{/each}
		</div>
	</section>

	<section>
		<h2>Cor de plumas</h2>
		<div class="swatch-grid swatch-grid--small">
			{#each catalog.featherColors as feather}
				<button
					class="swatch swatch--small"
					class:active={$configuratorState.featherColorId === feather.id}
					style:background={feather.colorHex}
					onclick={() => ($configuratorState.featherColorId = feather.id)}
					title={feather.nombre}
					aria-label={feather.nombre}
				></button>
			{/each}
		</div>
	</section>

	<p class="disclaimer">
		Prototipo técnico — xeometría e cores de mostra. 
	</p>
</aside>

<style>
	/*
	 * Todos los colores/tipografías/radios de este componente vienen de las
	 * variables globales (ver src/lib/theme.ts + app.css). No hardcodear
	 * valores nuevos aquí: añadirlos a theme.ts si hace falta un tono más.
	 */
	.panel {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
		padding: 1.75rem;
		background: linear-gradient(165deg, var(--color-ink-soft), var(--color-ink));
		color: var(--color-foam);
		border-radius: var(--radius-lg);
		border: 1px solid color-mix(in srgb, var(--color-petrol) 35%, transparent);
		height: 100%;
		box-sizing: border-box;
		overflow-y: auto;
	}
	header {
		display: flex;
		flex-direction: column;
		gap: 0.15rem;
		margin-bottom: 0.25rem;
	}
	.logo {
		width: 60px;
		height: 60px;
		border-radius: 50%;
		margin-bottom: 0.6rem;
		align-self: flex-start;
		border: 2px solid var(--color-petrol-light);
		box-shadow: 0 0 0 4px color-mix(in srgb, var(--color-petrol) 30%, transparent);
	}
	.eyebrow {
		font-family: var(--font-hand);
		font-size: 1.3rem;
		line-height: 1;
		color: var(--color-petrol-light);
	}
	h1 {
		font-size: 1.15rem;
		margin: 0.15rem 0 0 0;
		color: var(--color-foam);
	}
	h2 {
		font-family: var(--font-body);
		font-size: 0.72rem;
		font-weight: 600;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: var(--color-foam-dim);
		margin: 0 0 0.6rem 0;
	}
	.row {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
	}
	.chip {
		padding: 0.45rem 0.9rem;
		border-radius: var(--radius-pill);
		border: 1px solid color-mix(in srgb, var(--color-foam) 15%, transparent);
		background: color-mix(in srgb, var(--color-foam) 5%, transparent);
		color: var(--color-foam);
		font-size: 0.85rem;
		cursor: pointer;
		transition:
			border-color 0.15s ease,
			background 0.15s ease,
			transform 0.1s ease;
	}
	.chip--size {
		min-width: 3rem;
		text-align: center;
	}
	.chip:hover {
		background: color-mix(in srgb, var(--color-foam) 10%, transparent);
	}
	.chip.active {
		border-color: var(--color-accent);
		background: color-mix(in srgb, var(--color-accent) 18%, transparent);
		color: var(--color-foam);
	}
	.swatch-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(2.4rem, 1fr));
		gap: 0.55rem;
	}
	.swatch-grid--small {
		grid-template-columns: repeat(auto-fill, minmax(1.9rem, 1fr));
	}
	.swatch {
		aspect-ratio: 1;
		border-radius: var(--radius-sm);
		border: 2px solid transparent;
		cursor: pointer;
		box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.15);
		transition:
			box-shadow 0.15s ease,
			transform 0.1s ease;
	}
	.swatch--small {
		border-radius: var(--radius-pill);
	}
	.swatch:hover {
		transform: translateY(-1px);
	}
	/* Firma visual: el "doble anillo" del logo se repite aquí como marca de
	   selección — un halo exterior que rodea el swatch activo. */
	.swatch.active {
		border-color: var(--color-ink);
		box-shadow:
			inset 0 0 0 1px rgba(255, 255, 255, 0.25),
			0 0 0 2px var(--color-ink),
			0 0 0 4px var(--color-accent);
	}
	.disclaimer {
		margin-top: auto;
		font-size: 0.72rem;
		line-height: 1.4;
		color: var(--color-foam-dim);
	}
</style>
