let videoStream = null;
let videoElement = null;

/**
 * Inicializa la webcam y la muestra en la pantalla.
 * @param {number} width - Ancho del video
 * @param {number} height - Alto del video
 * @param {HTMLElement} parent - Elemento donde se insertará el video (opcional)
 * @returns {Promise<HTMLVideoElement|null>}
 */
export async function initWebcam(
  width = 640,
  height = 480,
  parent = document.body
) {
  try {
    // Solicitar acceso a la webcam
    videoStream = await navigator.mediaDevices.getUserMedia({
      video: { width, height },
    });

    // Crear elemento <video> si no existe
    if (!videoElement) {
      videoElement = document.createElement("video");
      videoElement.autoplay = true;
      videoElement.playsInline = true; // para iOS
      videoElement.muted = true; // silenciar el video
      videoElement.style.position = "absolute";
      videoElement.style.zIndex = 1000;
      videoElement.style.border = "3px solid #ffff00";
      videoElement.style.borderRadius = "8px";
      parent.appendChild(videoElement);
    }

    videoElement.srcObject = videoStream;

    console.log("Webcam initialized");
    return videoElement;
  } catch (err) {
    console.error("Error initializing webcam:", err);
    return null;
  }
}

/**
 * Devuelve el video stream activo
 * @returns {MediaStream|null}
 */
export function getWebcamStream() {
  return videoStream;
}

/**
 * Mueve y escala el video en pantalla
 * @param {number} x - posición X en px
 * @param {number} y - posición Y en px
 * @param {number} w - ancho
 * @param {number} h - alto
 */
export function setVideoPosition(x, y, w, h) {
  if (!videoElement) return;
  videoElement.style.left = `${x}px`;
  videoElement.style.top = `${y}px`;
  videoElement.style.width = `${w}px`;
  videoElement.style.height = `${h}px`;
}

/**
 * Oculta el video de la webcam
 */
export function hideWebcam() {
  if (videoElement) {
    videoElement.style.display = "none";
  }
}

/**
 * Muestra el video de la webcam
 */
export function showWebcam() {
  if (videoElement) {
    videoElement.style.display = "block";
  }
}

/**
 * Detiene la webcam y elimina el video
 */
export function stopWebcam() {
  if (videoStream) {
    // Detener todos los tracks de video
    videoStream.getTracks().forEach((track) => track.stop());
    videoStream = null;
  }

  // Remover el elemento <video> si existe en DOM
  const videoEl = document.getElementById("player-webcam");
  if (videoEl) {
    videoEl.pause();
    videoEl.srcObject = null;
    videoEl.remove();
  }

  console.log("Webcam stopped");
}
