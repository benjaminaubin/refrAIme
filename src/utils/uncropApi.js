/**
 * Utility function to call the uncrop API via the backend proxy
 * @param {Blob} imageBlob - The image to uncrop
 * @param {Object} extendParams - The extend parameters
 * @param {number} extendParams.extend_left - Pixels to add to the left
 * @param {number} extendParams.extend_right - Pixels to add to the right
 * @param {number} extendParams.extend_up - Pixels to add to the top
 * @param {number} extendParams.extend_down - Pixels to add to the bottom
 * @param {string} [manualApiKey] - Optional manually provided API key
 * @returns {Promise<Blob>} - The uncropped image as a blob
 */
export async function callUncropApi(imageBlob, extendParams, manualApiKey) {
    // Attempt to get API key from Vite env or process env if available
    const apiKey = manualApiKey || import.meta.env.VITE_CLIPDROP_API_KEY || import.meta.env.CLIPDROP_API_KEY;

    if (!apiKey) {
        throw new Error('ClipDrop API key not found. Please provide an API key below the crop area.');
    }

    const formData = new FormData();
    formData.append('image_file', imageBlob, 'image.jpg');

    // Add extend parameters
    if (extendParams.extend_left) {
        formData.append('extend_left', String(extendParams.extend_left));
    }
    if (extendParams.extend_right) {
        formData.append('extend_right', String(extendParams.extend_right));
    }
    if (extendParams.extend_up) {
        formData.append('extend_up', String(extendParams.extend_up));
    }
    if (extendParams.extend_down) {
        formData.append('extend_down', String(extendParams.extend_down));
    }

    const response = await fetch('https://clipdrop-api.co/uncrop/v1', {
        method: 'POST',
        headers: {
            'x-api-key': apiKey,
        },
        body: formData,
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || `API error: ${response.status}`);
    }

    return await response.blob();
}

/**
 * Calculate the extend parameters needed when crop extends outside image bounds
 * @param {Object} cropArea - The crop area in natural image pixels
 * @param {number} cropArea.x - X position (can be negative)
 * @param {number} cropArea.y - Y position (can be negative)
 * @param {number} cropArea.width - Crop width
 * @param {number} cropArea.height - Crop height
 * @param {number} imageWidth - Natural image width
 * @param {number} imageHeight - Natural image height
 * @returns {Object|null} - Object with extend params, or null if crop is within bounds
 */
export function calculateExtendParams(cropArea, imageWidth, imageHeight) {
    let extend_left = 0;
    let extend_right = 0;
    let extend_up = 0;
    let extend_down = 0;

    // Check if crop extends beyond left edge
    if (cropArea.x < 0) {
        extend_left = Math.abs(Math.round(cropArea.x));
    }

    // Check if crop extends beyond top edge
    if (cropArea.y < 0) {
        extend_up = Math.abs(Math.round(cropArea.y));
    }

    // Check if crop extends beyond right edge
    const rightEdge = cropArea.x + cropArea.width;
    if (rightEdge > imageWidth) {
        extend_right = Math.round(rightEdge - imageWidth);
    }

    // Check if crop extends beyond bottom edge
    const bottomEdge = cropArea.y + cropArea.height;
    if (bottomEdge > imageHeight) {
        extend_down = Math.round(bottomEdge - imageHeight);
    }

    // Return null if no extension needed
    if (extend_left === 0 && extend_right === 0 && extend_up === 0 && extend_down === 0) {
        return null;
    }

    return { extend_left, extend_right, extend_up, extend_down };
}

/**
 * Check if a crop area extends outside the image bounds
 * @param {Object} cropArea - The crop area
 * @param {number} imageWidth - Image width
 * @param {number} imageHeight - Image height
 * @returns {boolean} - True if crop is out of bounds
 */
export function isOutOfBounds(cropArea, imageWidth, imageHeight) {
    return (
        cropArea.x < 0 ||
        cropArea.y < 0 ||
        cropArea.x + cropArea.width > imageWidth ||
        cropArea.y + cropArea.height > imageHeight
    );
}
