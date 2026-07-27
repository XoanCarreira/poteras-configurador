import adapter from '@sveltejs/adapter-auto';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [
		sveltekit({
			compilerOptions: {
				// Force runes mode for the project, except for libraries. Can be removed in svelte 6.
				runes: ({ filename }) =>
					filename.split(/[/\\]/).includes('node_modules') ? undefined : true
			},

			// adapter-auto only supports some environments, see https://svelte.dev/docs/kit/adapter-auto for a list.
			// If your environment is not supported, or you settled on a specific environment, switch out the adapter.
			// See https://svelte.dev/docs/kit/adapters for more information about adapters.
			adapter: adapter()
		})
	],
	build: {
		// Three.js (~550KB) vive en un chunk propio, cargado de forma diferida
		// mediante import() dinámico en +page.svelte (ver docs/ARCHITECTURE.md).
		// No bloquea la carga inicial de la página, así que subimos el límite
		// del aviso para no generar ruido en el build por algo ya resuelto.
		chunkSizeWarningLimit: 600
	}
});
