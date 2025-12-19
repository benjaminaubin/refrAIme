import React, { useState, useRef, useEffect } from 'react';
import ReactCrop, { centerCrop, makeAspectCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { RotateCcw, Wand2, Scissors } from 'lucide-react';
import Button from './Button';
import { isOutOfBounds } from '../utils/uncropApi';
import './Cropper.css';

function centerAspectCrop(mediaWidth, mediaHeight, aspect) {
    if (aspect) {
        let width = mediaWidth;
        let height = width / aspect;

        if (height > mediaHeight) {
            height = mediaHeight;
            width = height * aspect;
        }

        return centerCrop(
            {
                unit: 'px',
                width,
                height,
            },
            mediaWidth,
            mediaHeight,
        );
    }

    return centerCrop(
        makeAspectCrop(
            {
                unit: '%',
                width: 90,
            },
            1,
            mediaWidth,
            mediaHeight,
        ),
        mediaWidth,
        mediaHeight,
    );
}

const ImageCropper = ({ imageSrc, onCrop, onDownload, onUploadNew, isProcessing, isUncropMode, setIsUncropMode, apiKey, setApiKey }) => {
    const [crop, setCrop] = useState();
    const [completedCrop, setCompletedCrop] = useState(null);
    const [aspect, setAspect] = useState(1);
    const [zoom, setZoom] = useState(0.8);
    const [pan, setPan] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [isShiftPressed, setIsShiftPressed] = useState(false);
    const [lastMousePos, setLastMousePos] = useState({ x: 0, y: 0 });
    const [imgSize, setImgSize] = useState({ width: 0, height: 0 });
    const imgRef = useRef(null);
    const areaRef = useRef(null);
    const prevPixelCropRef = useRef(null);

    const PADDING = 1000;

    const onImageLoad = (e) => {
        const { width, height } = e.currentTarget;
        setImgSize({ width, height });

        const totalWidth = width + PADDING * 2;
        const totalHeight = height + PADDING * 2;

        // Default to full image with free aspect (centered in the padded area)
        // Expressed in percentage of the padded container
        const newCrop = {
            unit: '%',
            x: (PADDING / totalWidth) * 100,
            y: (PADDING / totalHeight) * 100,
            width: (width / totalWidth) * 100,
            height: (height / totalHeight) * 100,
        };

        setAspect(undefined);
        setCrop(newCrop);
        setCompletedCrop(newCrop);
        updateDimensionsState(newCrop, width, height);
    };

    // Helper to update dimensions state from a crop
    const updateDimensionsState = (c, w, h) => {
        if (!w || !h || !c) return;
        const img = imgRef.current;
        if (!img) return;

        const scaleX = img.naturalWidth / w;
        const scaleY = img.naturalHeight / h;

        const totalWidth = w + PADDING * 2;
        const totalHeight = h + PADDING * 2;

        const isPercent = c.unit === '%';
        const widthPx = isPercent ? (c.width * totalWidth) / 100 : c.width;
        const heightPx = isPercent ? (c.height * totalHeight) / 100 : c.height;

        setDimensions({
            width: Math.round(widthPx * scaleX / (isPercent ? 1 : zoom)),
            height: Math.round(heightPx * scaleY / (isPercent ? 1 : zoom))
        });
    };

    const handleAspectChange = (newAspect) => {
        setAspect(newAspect);
        if (imgSize.width) {
            const { width, height } = imgSize;

            // Calculate crop relative to the image size (standard pixels)
            const baseCrop = centerAspectCrop(width, height, newAspect || undefined);

            const totalWidth = width + PADDING * 2;
            const totalHeight = height + PADDING * 2;

            // Convert to percentage relative to padded container
            const newCrop = {
                unit: '%',
                x: ((baseCrop.x + PADDING) / totalWidth) * 100,
                y: ((baseCrop.y + PADDING) / totalHeight) * 100,
                width: (baseCrop.width / totalWidth) * 100,
                height: (baseCrop.height / totalHeight) * 100,
            };

            setCrop(newCrop);
            setCompletedCrop(newCrop);
            updateDimensionsState(newCrop, width, height);
        }
    };

    const handleFreeAspect = () => {
        setAspect(undefined);
    };


    const handleCrop = () => {
        if (completedCrop && imgRef.current && imgSize.width) {
            const scaleX = imgRef.current.naturalWidth / imgSize.width;
            const scaleY = imgRef.current.naturalHeight / imgSize.height;

            const totalWidth = imgSize.width + PADDING * 2;
            const totalHeight = imgSize.height + PADDING * 2;

            const pixelCrop = {
                x: Math.round(((completedCrop.x * totalWidth) / 100 - PADDING) * scaleX),
                y: Math.round(((completedCrop.y * totalHeight) / 100 - PADDING) * scaleY),
                width: Math.round(((completedCrop.width * totalWidth) / 100) * scaleX),
                height: Math.round(((completedCrop.height * totalHeight) / 100) * scaleY),
            };
            onCrop(pixelCrop);
        }
    };

    const handleDownload = () => {
        if (completedCrop && imgRef.current && imgSize.width) {
            const scaleX = imgRef.current.naturalWidth / imgSize.width;
            const scaleY = imgRef.current.naturalHeight / imgSize.height;

            const totalWidth = imgSize.width + PADDING * 2;
            const totalHeight = imgSize.height + PADDING * 2;

            const pixelCrop = {
                x: Math.round(((completedCrop.x * totalWidth) / 100 - PADDING) * scaleX),
                y: Math.round(((completedCrop.y * totalHeight) / 100 - PADDING) * scaleY),
                width: Math.round(((completedCrop.width * totalWidth) / 100) * scaleX),
                height: Math.round(((completedCrop.height * totalHeight) / 100) * scaleY),
            };
            onDownload(pixelCrop);
        }
    };

    const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

    useEffect(() => {
        if (completedCrop && imgRef.current && imgSize.width) {
            updateDimensionsState(completedCrop, imgSize.width, imgSize.height);

            const scaleX = imgRef.current.naturalWidth / imgSize.width;
            const scaleY = imgRef.current.naturalHeight / imgSize.height;

            const totalWidth = imgSize.width + PADDING * 2;
            const totalHeight = imgSize.height + PADDING * 2;

            const cropWidth = ((completedCrop.width * totalWidth) / 100) * scaleX;
            const cropHeight = ((completedCrop.height * totalHeight) / 100) * scaleY;
            const cropX = ((completedCrop.x * totalWidth) / 100 - PADDING) * scaleX;
            const cropY = ((completedCrop.y * totalHeight) / 100 - PADDING) * scaleY;

            const needsUncrop = isOutOfBounds(
                { x: cropX, y: cropY, width: cropWidth, height: cropHeight },
                imgRef.current.naturalWidth,
                imgRef.current.naturalHeight
            );
            setIsUncropMode(needsUncrop);
        }
    }, [completedCrop, imgSize]);

    const handleDimensionChange = (e, type) => {
        const value = Number(e.target.value);
        if (imgRef.current && imgSize.width && !isNaN(value)) {
            const scaleX = imgRef.current.naturalWidth / imgSize.width;
            const scaleY = imgRef.current.naturalHeight / imgSize.height;

            const totalWidth = imgSize.width + PADDING * 2;
            const totalHeight = imgSize.height + PADDING * 2;

            setCrop(prev => {
                const newWidthPx = type === 'width' ? value / scaleX : (prev.width * totalWidth) / 100;
                const newHeightPx = type === 'height' ? value / scaleY : (prev.height * totalHeight) / 100;

                const newCrop = {
                    ...prev,
                    width: (newWidthPx / totalWidth) * 100,
                    height: (newHeightPx / totalHeight) * 100,
                };

                setCompletedCrop(newCrop);
                return newCrop;
            });

            setAspect(undefined);
        }
    };

    const handleWheel = (e) => {
        // Zoom on wheel (optionally with ctrl/cmd)
        const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
        const isZooming = isMac ? e.ctrlKey : e.ctrlKey; // Chrome on Mac uses ctrlKey for trackpad zoom

        // Sensitivity adjustment: not too sensible
        const delta = e.deltaY * -0.001;
        setZoom(prev => Math.min(Math.max(0.1, prev + delta), 5));
    };

    const handleMouseDown = (e) => {
        // Only pan if clicking on the background or with space/middle click
        if (e.target.classList.contains('cropper-area') || e.button === 1) {
            setIsDragging(true);
            setLastMousePos({ x: e.clientX, y: e.clientY });
        }
    };

    const handleMouseMove = (e) => {
        if (isDragging) {
            const dx = e.clientX - lastMousePos.x;
            const dy = e.clientY - lastMousePos.y;
            setPan(prev => ({ x: prev.x + dx, y: prev.y + dy }));
            setLastMousePos({ x: e.clientX, y: e.clientY });
        }
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Shift') setIsShiftPressed(true);
        };
        const handleKeyUp = (e) => {
            if (e.key === 'Shift') setIsShiftPressed(false);
        };

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);

        const area = areaRef.current;
        if (area) {
            area.addEventListener('wheel', handleWheel, { passive: false });
        }

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
            if (area) area.removeEventListener('wheel', handleWheel);
        };
    }, []);

    return (
        <div className="cropper-wrapper">
            <div
                ref={areaRef}
                className="cropper-area checkerboard"
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
            >
                <div
                    className="zoom-pan-wrapper"
                    style={{
                        transform: `translate(${pan.x}px, ${pan.y}px)`,
                        transition: isDragging ? 'none' : 'transform 0.1s ease-out'
                    }}
                >
                    <ReactCrop
                        crop={crop}
                        onChange={(c, pc) => {
                            let newCrop = pc;

                            if (isShiftPressed && imgSize.width) {
                                // Calculate total container size (image + padding on both sides)
                                const totalWidth = imgSize.width + PADDING * 2;
                                const totalHeight = imgSize.height + PADDING * 2;
                                
                                // Image bounds in percentage of total container
                                const imgLeftPct = (PADDING / totalWidth) * 100;
                                const imgTopPct = (PADDING / totalHeight) * 100;
                                const imgRightPct = ((PADDING + imgSize.width) / totalWidth) * 100;
                                const imgBottomPct = ((PADDING + imgSize.height) / totalHeight) * 100;
                                
                                // Threshold in percentage (roughly 15px equivalent at zoom=1)
                                const THRESHOLD_PX = 15;
                                const thresholdXPct = (THRESHOLD_PX / (totalWidth * zoom)) * 100;
                                const thresholdYPct = (THRESHOLD_PX / (totalHeight * zoom)) * 100;

                                const snapped = { ...pc };
                                let changed = false;

                                const prev = prevPixelCropRef.current || pc;
                                const isMoving = Math.abs(pc.width - prev.width) < 0.01 && Math.abs(pc.height - prev.height) < 0.01;

                                if (isMoving) {
                                    // Snap the whole box when moving
                                    if (Math.abs(pc.x - imgLeftPct) < thresholdXPct) {
                                        snapped.x = imgLeftPct;
                                        changed = true;
                                    } else if (Math.abs((pc.x + pc.width) - imgRightPct) < thresholdXPct) {
                                        snapped.x = imgRightPct - pc.width;
                                        changed = true;
                                    }

                                    if (Math.abs(pc.y - imgTopPct) < thresholdYPct) {
                                        snapped.y = imgTopPct;
                                        changed = true;
                                    } else if (Math.abs((pc.y + pc.height) - imgBottomPct) < thresholdYPct) {
                                        snapped.y = imgBottomPct - pc.height;
                                        changed = true;
                                    }
                                } else if (!aspect) {
                                    // Snap individual edges when resizing (only if no aspect ratio is fixed)
                                    // Snap Left edge
                                    if (Math.abs(pc.x - imgLeftPct) < thresholdXPct && Math.abs(pc.x - prev.x) > 0.01) {
                                        snapped.width += (pc.x - imgLeftPct);
                                        snapped.x = imgLeftPct;
                                        changed = true;
                                    }
                                    // Snap Top edge
                                    if (Math.abs(pc.y - imgTopPct) < thresholdYPct && Math.abs(pc.y - prev.y) > 0.01) {
                                        snapped.height += (pc.y - imgTopPct);
                                        snapped.y = imgTopPct;
                                        changed = true;
                                    }
                                    // Snap Right edge
                                    if (Math.abs((pc.x + pc.width) - imgRightPct) < thresholdXPct && Math.abs((pc.x + pc.width) - (prev.x + prev.width)) > 0.01) {
                                        snapped.width = imgRightPct - snapped.x;
                                        changed = true;
                                    }
                                    // Snap Bottom edge
                                    if (Math.abs((pc.y + pc.height) - imgBottomPct) < thresholdYPct && Math.abs((pc.y + pc.height) - (prev.y + prev.height)) > 0.01) {
                                        snapped.height = imgBottomPct - snapped.y;
                                        changed = true;
                                    }
                                }

                                if (changed) {
                                    newCrop = snapped;
                                }
                            }

                            prevPixelCropRef.current = newCrop;
                            setCrop(newCrop);
                            if (imgSize.width) {
                                updateDimensionsState(newCrop, imgSize.width, imgSize.height);
                            }
                        }}
                        onComplete={(c, pc) => setCompletedCrop(pc)}
                        aspect={aspect}
                    >
                        <div
                            className="crop-target"
                            style={{
                                padding: `${PADDING * zoom}px`,
                                width: 'fit-content',
                                height: 'fit-content'
                            }}
                        >
                            <img
                                ref={imgRef}
                                alt="Crop me"
                                src={imageSrc}
                                onLoad={onImageLoad}
                                style={{
                                    width: imgSize.width ? `${imgSize.width * zoom}px` : 'auto',
                                    height: imgSize.height ? `${imgSize.height * zoom}px` : 'auto',
                                    display: 'block'
                                }}
                            />
                        </div>
                    </ReactCrop>
                </div>
            </div>

            <div className="floating-ui-container">
                <div className="controls-row">
                    <div className="aspect-controls">
                        <button
                            className={`aspect-btn ${aspect === undefined ? 'active' : ''}`}
                            onClick={() => handleFreeAspect()}
                        >
                            Free
                        </button>
                        <button
                            className={`aspect-btn ${aspect === 1 ? 'active' : ''}`}
                            onClick={() => handleAspectChange(1)}
                        >
                            1:1
                        </button>
                        <button
                            className={`aspect-btn ${aspect === 5 / 4 ? 'active' : ''}`}
                            onClick={() => handleAspectChange(5 / 4)}
                        >
                            5:4
                        </button>
                        <button
                            className={`aspect-btn ${aspect === 4 / 3 ? 'active' : ''}`}
                            onClick={() => handleAspectChange(4 / 3)}
                        >
                            4:3
                        </button>
                        <button
                            className={`aspect-btn ${aspect === 16 / 9 ? 'active' : ''}`}
                            onClick={() => handleAspectChange(16 / 9)}
                        >
                            16:9
                        </button>
                        <button
                            className={`aspect-btn ${aspect === 9 / 16 ? 'active' : ''}`}
                            onClick={() => handleAspectChange(9 / 16)}
                        >
                            9:16
                        </button>
                    </div>

                    <div className="dimension-controls">
                        <span className="separator" style={{ color: 'var(--text-muted)', fontSize: '1.2rem', fontWeight: 300 }}>|</span>
                        <label>
                            W:
                            <input
                                type="number"
                                value={dimensions.width}
                                onChange={(e) => handleDimensionChange(e, 'width')}
                                className="dim-input"
                            />
                        </label>
                        <label>
                            H:
                            <input
                                type="number"
                                value={dimensions.height}
                                onChange={(e) => handleDimensionChange(e, 'height')}
                                className="dim-input"
                            />
                        </label>
                    </div>
                    {isUncropMode && (
                        <div className="api-key-container">
                            <span className="separator" style={{ color: 'var(--text-muted)', fontSize: '1.2rem', fontWeight: 300 }}>|</span>
                            <label htmlFor="api-key"><a href="https://clipdrop.co/apis" target="_blank">Clipdrop API Key:</a></label>
                            <input
                                id="api-key"
                                type="password"
                                placeholder="Enter your API key"
                                value={apiKey}
                                onChange={(e) => setApiKey(e.target.value)}
                                className="api-key-input"
                            />
                        </div>
                    )}
                </div>

                <div className="action-buttons">
                    <Button
                        variant={isUncropMode ? 'purple' : 'primary'}
                        onClick={handleCrop}
                        disabled={isProcessing}
                    >
                        {isUncropMode ? <Wand2 size={18} /> : <Scissors size={18} />}
                        {isUncropMode ? 'Uncrop' : 'Crop'}
                    </Button>
                    <Button
                        variant="secondary"
                        onClick={onUploadNew}
                        disabled={isProcessing}
                        title="Reset and upload new image"
                    >
                        <RotateCcw size={18} />
                        Reset
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default ImageCropper;
