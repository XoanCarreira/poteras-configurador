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
	}else if(colors.length === 5) {
		const degradadoPotera = ctx.createLinearGradient(0, 0, canvas.width, 0);

		const posiciones = [0, 0.5, 0.55, 0.92, 1]; // Posiciones de los colores en el degradado (0 a 1)

		colors.forEach((color, i) => {
			degradadoPotera.addColorStop(posiciones[i], color);
		});



	// 3. Aplicar el degradado al canvas
	ctx.fillStyle = degradadoPotera;
	ctx.fillRect(0, 0, canvas.width, canvas.height);

	}else{
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

/**
 * Genera una textura MATCAP para simular un ojo realista: pupila oscura en
 * el centro que se funde hacia un borde claro (esclerótica), más un pequeño
 * brillo/catchlight para dar sensación de humedad.
 *
 * IMPORTANTE: se usa como `matcap` (MeshMatcapMaterial), no como `map` normal.
 * La diferencia es clave: un `map` normal se proyecta según el UV del mesh
 * (si el UV no está bien desplegado, o no existe, el resultado puede verse
 * plano o de un solo color). Un `matcap` en cambio se calcula según el
 * ángulo de la normal respecto a la cámara — funciona igual de bien sin
 * importar el UV del modelo, y da automáticamente ese aspecto "esférico y
 * brillante" tan característico de un ojo real.
 */
export function createRadialTexture(centerColor: string, edgeColor: string): THREE.CanvasTexture {
	const canvas = document.createElement('canvas');
	canvas.width = 256;
	canvas.height = 256;
	const ctx = canvas.getContext('2d')!;
	const cx = canvas.width / 2;
	const cy = canvas.height / 2;

	// Degradado principal: pupila (centro) → esclerótica (borde). El centro
	// del matcap = normal apuntando directo a cámara, así que un centro
	// oscuro se ve siempre como una "pupila" mirando de frente.
	const gradient = ctx.createRadialGradient(cx, cy, canvas.width * 0.05, cx, cy, canvas.width * 0.5);
	gradient.addColorStop(0, centerColor);
	gradient.addColorStop(0.55, centerColor);
	gradient.addColorStop(0.60, edgeColor);
	gradient.addColorStop(1, edgeColor);
	ctx.fillStyle = gradient;
	ctx.fillRect(0, 0, canvas.width, canvas.height);

	// Pequeño brillo/catchlight, desplazado del centro, para dar sensación
	// de humedad/realismo (como el reflejo de luz en un ojo real).
	const hx = cx - canvas.width * 0.16;
	const hy = cy - canvas.height * 0.16;
	const highlight = ctx.createRadialGradient(hx, hy, 0, hx, hy, canvas.width * 0.14);
	highlight.addColorStop(0, 'rgba(255,255,255,0.95)');
	highlight.addColorStop(1, 'rgba(255,255,255,0)');
	ctx.fillStyle = highlight;
	ctx.fillRect(0, 0, canvas.width, canvas.height);

	const texture = new THREE.CanvasTexture(canvas);
	texture.colorSpace = THREE.SRGBColorSpace;
	return texture;
}
