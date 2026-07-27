/**
 * Tokens de diseño — Poteras Artesanales Riotinta
 * ------------------------------------------------
 * Fuente única de la identidad visual del proyecto. Cualquier cambio de
 * marca (colores, tipografías, radios) se hace SOLO aquí:
 *
 * - Los valores de `colors` se vuelcan como variables CSS (--color-*) en
 *   `+layout.svelte`, y de ahí los consume todo el CSS de la app (ver
 *   `app.css` y los <style> de los componentes .svelte).
 * - El visualizador 3D (Three.js no entiende CSS) importa este mismo
 *   objeto directamente para que la escena 3D use exactamente los mismos
 *   colores que la interfaz.
 *
 * Paleta derivada del logo del fabricante (azul petróleo/turquesa, negro
 * profundo tipo "mancha de tinta", blanco roto cálido) + un acento cálido
 * (coral) que conecta con los colores vivos reales de las poteras.
 */

export const colors = {
	// Base — evocan el agua profunda / la "mancha de tinta" del logo
	ink: '#0b1414',
	inkSoft: '#12282b',
	inkSofter: '#193b3f',

	// Marca — azul petróleo del pulpo/aro del logo
	petrol: '#1f7a82',
	petrolDeep: '#114850',
	petrolLight: '#6fd0d6',

	// Cálidos — el "hat" del pulpo / blanco roto
	foam: '#f4f1e8',
	foamDim: '#cfd9d6',

	// Acento — conecta con los colores vivos de las poteras reales
	accent: '#ff6b3d',
	accentDeep: '#e4501f'
} as const;

export const fonts = {
	display: "'Bungee', system-ui, sans-serif",
	hand: "'Caveat', cursive",
	body: "'Inter', system-ui, -apple-system, sans-serif"
} as const;

export const radii = {
	sm: '10px',
	md: '14px',
	lg: '20px',
	pill: '999px'
} as const;

/** URL de Google Fonts para las tipografías de marca (display + hand). */
export const fontImportUrl =
	'https://fonts.googleapis.com/css2?family=Bungee&family=Caveat:wght@500;700&family=Inter:wght@400;500;600;700&display=swap';
