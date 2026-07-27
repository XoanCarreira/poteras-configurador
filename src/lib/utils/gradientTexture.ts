import * as THREE from 'three';

/**
 * Genera una textura de degradado longitudinal a partir de una lista de colores.
 *
 * NOTA: en producción, esta función se sustituirá por texturas reales
 * pre-generadas por diseño (ver docs/ARCHITECTURE.md, sección 4 y 5),
 * ajustadas al UV real del modelo 3D final. Esta versión procedural sirve
 * únicamente para validar el pipeline en esta fase de prototipo, antes de
 * contar con los modelos y texturas definitivos.
 */
export function createBodyTexture(colors: string[]): THREE.CanvasTexture {
	const canvas = document.createElement('canvas');
	canvas.width = 128;
	canvas.height = 512;
	const ctx = canvas.getContext('2d')!;

	if (colors.length === 1) {
		ctx.fillStyle = colors[0];
		ctx.fillRect(0, 0, canvas.width, canvas.height);
	} else {
		const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
		colors.forEach((color, i) => {
			gradient.addColorStop(i / (colors.length - 1), color);
		});
		ctx.fillStyle = gradient;
		ctx.fillRect(0, 0, canvas.width, canvas.height);
	}

	// Textura sutil tipo "tejido" para acercarse al acabado real del cuerpo
	ctx.globalAlpha = 0.08;
	ctx.fillStyle = '#000000';
	for (let y = 0; y < canvas.height; y += 4) {
		ctx.fillRect(0, y, canvas.width, 1);
	}
	ctx.globalAlpha = 1;

	const texture = new THREE.CanvasTexture(canvas);
	texture.wrapS = THREE.ClampToEdgeWrapping;
	texture.wrapT = THREE.ClampToEdgeWrapping;
	texture.colorSpace = THREE.SRGBColorSpace;
	return texture;
}
