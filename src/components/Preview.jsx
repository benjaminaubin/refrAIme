
import React from 'react';
import Button from './Button';
import './Cropper.css';
import './Preview.css';

const Preview = ({ imageSrc, onCancel, onDownload }) => {
    return (
        <div className="cropper-wrapper">
            <div className="cropper-area preview-container checkerboard">
                <img
                    src={imageSrc}
                    alt="Preview"
                    className="preview-image"
                />
            </div>
            <div className="floating-ui-container">
                <div className="action-buttons">
                    <Button variant="secondary" onClick={onCancel}>
                        Back
                    </Button>
                    <Button variant="primary" onClick={onDownload}>
                        Download
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default Preview;
