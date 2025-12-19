/**
 * Utility to process an image file and call a callback with the data URL
 * @param {File} file - The file to process
 * @param {Function} onImageLoaded - Callback with (result, fileName)
 */
export const processImageFile = (file, onImageLoaded) => {
    if (file && file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.addEventListener("load", () => {
            onImageLoaded(reader.result, file.name);
        });
        reader.readAsDataURL(file);
    }
};
