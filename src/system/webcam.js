let videoStream = null;

export async function initWebcam(width = 640, height = 480) {
    try {
        videoStream = await navigator.mediaDevices.getUserMedia({
            video: {
                width,
                height,
            }
        });

        console.log("Webcam initialized");
        return videoStream;

    } catch (err) {
        console.error("Error initializing webcam:", err);
        return null;
    }
}

export function getWebcamStream() {
    return videoStream;
}
