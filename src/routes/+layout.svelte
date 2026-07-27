<script lang="ts">
	import '../app.css';
	import { colors, fonts, radii, fontImportUrl } from '$lib/theme';

	let { children } = $props();

	function toKebab(str: string) {
		return str.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
	}

	const cssVars = [
		...Object.entries(colors).map(([key, value]) => `--color-${toKebab(key)}: ${value};`),
		...Object.entries(fonts).map(([key, value]) => `--font-${toKebab(key)}: ${value};`),
		...Object.entries(radii).map(([key, value]) => `--radius-${toKebab(key)}: ${value};`)
	].join('\n\t\t');
</script>

<svelte:head>
	<link rel="icon" href="/brand/logo-riotinta.png" />
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="" />
	<link rel="stylesheet" href={fontImportUrl} />
	{@html `<style>:root {\n\t\t${cssVars}\n\t}</style>`}
</svelte:head>

{@render children()}
