import React, { useState, useCallback, useEffect } from 'react';
import ImageUploader from './components/ImageUploader';
import ImageCropper from './components/Cropper';
import getCroppedImg, { createImage } from './utils/canvasUtils';
import { callUncropApi, calculateExtendParams } from './utils/uncropApi';
import { processImageFile } from './utils/fileUtils';
import './App.css';

import Preview from './components/Preview';

function App() {
  const [imageSrc, setImageSrc] = useState(null);
  const [fileName, setFileName] = useState(null);
  const [previewSrc, setPreviewSrc] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isUncropMode, setIsUncropMode] = useState(false);
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('clipdrop_api_key') || '');
  const [error, setError] = useState(null);

  useEffect(() => {
    localStorage.setItem('clipdrop_api_key', apiKey);
  }, [apiKey]);

  const onImageSelected = (selectedImg, name) => {
    setImageSrc(selectedImg);
    setFileName(name);
    setPreviewSrc(null);
    setError(null);
  };

  const processFile = (file) => {
    processImageFile(file, onImageSelected);
  };

  const handleGlobalDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleGlobalDragOver = (e) => {
    e.preventDefault();
  };

  const onUploadNew = () => {
    setImageSrc(null);
    setPreviewSrc(null);
    setError(null);
  };

  const generateCrop = async (croppedAreaPixels) => {
    try {
      setIsProcessing(true);
      setError(null);

      // Load the image to get its natural dimensions
      const image = await createImage(imageSrc);
      const naturalWidth = image.naturalWidth || image.width;
      const naturalHeight = image.naturalHeight || image.height;

      // Check if crop extends outside image bounds
      const extendParams = calculateExtendParams(
        croppedAreaPixels,
        naturalWidth,
        naturalHeight
      );

      if (extendParams) {
        // Uncrop mode: need to call the API

        // First, convert the original image to a blob
        const response = await fetch(imageSrc);
        const originalBlob = await response.blob();

        // Call the uncrop API
        const uncroppedBlob = await callUncropApi(originalBlob, extendParams, apiKey);

        // Now crop the uncropped image to get the final result
        // The uncropped image is larger, so we need to adjust the crop coordinates
        const uncroppedUrl = URL.createObjectURL(uncroppedBlob);

        // Adjust crop coordinates for the extended image
        const adjustedCrop = {
          x: croppedAreaPixels.x + extendParams.extend_left,
          y: croppedAreaPixels.y + extendParams.extend_up,
          width: croppedAreaPixels.width,
          height: croppedAreaPixels.height
        };

        const result = await getCroppedImg(uncroppedUrl, adjustedCrop);
        URL.revokeObjectURL(uncroppedUrl);

        return result;
      } else {
        // Normal crop
        return await getCroppedImg(imageSrc, croppedAreaPixels);
      }
    } catch (e) {
      console.error('Crop error:', e);
      setError(e.message || 'An error occurred while processing the image');
      return null;
    } finally {
      setIsProcessing(false);
    }
  };

  const onCrop = useCallback(async (croppedAreaPixels) => {
    const blob = await generateCrop(croppedAreaPixels);
    if (blob) {
      const url = URL.createObjectURL(blob);
      setPreviewSrc(url);
    }
  }, [imageSrc, apiKey]);

  const onDownload = useCallback(async (croppedAreaPixels) => {
    let blob = null;
    if (previewSrc && !croppedAreaPixels) {
      // Preview is already a blob URL, fetch it
      const response = await fetch(previewSrc);
      blob = await response.blob();
    } else if (croppedAreaPixels) {
      blob = await generateCrop(croppedAreaPixels);
    }

    if (blob) {
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');

      // getCroppedImg outputs JPEG, so ensure filename ends with .jpg
      const baseName = fileName ? fileName.replace(/\.[^/.]+$/, '') : 'cropped-image';
      const downloadName = `${baseName}.jpg`;

      // Set download attribute BEFORE href for better Chrome compatibility
      link.setAttribute('download', downloadName);
      link.setAttribute('href', url);
      link.style.display = 'none';

      document.body.appendChild(link);

      // Use a small delay before clicking for Chrome compatibility
      requestAnimationFrame(() => {
        link.click();
        // Clean up after a longer delay to ensure download starts
        setTimeout(() => {
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
        }, 1000);
      });
    }
  }, [imageSrc, fileName, previewSrc, apiKey]);

  return (
    <div
      className={`app-container ${isUncropMode ? 'uncrop-theme' : ''} ${!imageSrc ? 'checkerboard landing-state' : ''}`}
      onDrop={handleGlobalDrop}
      onDragOver={handleGlobalDragOver}
    >
      <header>
        <h1>
          <span className="brand-name">RefrAIme</span>
        </h1>
      </header>

      <main>
        {error && (
          <div className="error-banner">
            <span>{error}</span>
            <button onClick={() => setError(null)}>×</button>
          </div>
        )}

        {isProcessing && (
          <div className="processing-overlay">
            <div className="processing-spinner"></div>
            <span>Processing with AI...</span>
          </div>
        )}

        {!imageSrc ? (
          <ImageUploader onImageSelected={onImageSelected} />
        ) : previewSrc ? (
          <Preview
            imageSrc={previewSrc}
            onCancel={() => setPreviewSrc(null)}
            onDownload={() => onDownload(null)}
          />
        ) : (
          <ImageCropper
            imageSrc={imageSrc}
            onCrop={onCrop}
            onDownload={onDownload}
            onUploadNew={onUploadNew}
            isProcessing={isProcessing}
            isUncropMode={isUncropMode}
            setIsUncropMode={setIsUncropMode}
            apiKey={apiKey}
            setApiKey={setApiKey}
          />
        )}
      </main>
    </div>
  );
}

export default App;
