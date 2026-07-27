import adapter from '@sveltejs/adapter-static';
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

			// App 100% estática (sin datos de servidor) → adapter-static.
			// Genera un `index.html` real en `build/`, listo para cualquier
			// hosting estático (Netlify, Vercel, GitHub Pages...).
			// Solo hay una página y se prerenderiza entera: no hace falta
			// fallback SPA. Ver docs/ARCHITECTURE.md y netlify.toml.
			adapter: adapter({
				pages: 'build',
				assets: 'build',
				precompress: false,
				strict: true
			})
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
