import { useRef, useState } from 'react';
import { Upload } from 'lucide-react';
import { processImageFile } from '../utils/fileUtils';
import './ImageUploader.css';

const ImageUploader = ({ onImageSelected }) => {
    const [isDragOver, setIsDragOver] = useState(false);
    const fileInputRef = useRef(null);

    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragOver(true);
    };

    const handleDragLeave = () => {
        setIsDragOver(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragOver(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            processFile(e.dataTransfer.files[0]);
        }
    };

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files.length > 0) {
            processFile(e.target.files[0]);
        }
    };

    const processFile = (file) => {
        processImageFile(file, onImageSelected);
    };

    return (
        <div
            className={`uploader-container ${isDragOver ? 'drag-over' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current.click()}
        >
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                style={{ display: 'none' }}
            />
            <div className="uploader-content">
                <div className="icon-wrapper">
                    <Upload size={48} color={isDragOver ? '#3b82f6' : '#94a3b8'} />
                </div>
                <h3>Upload an Image</h3>
                <p>Drag & drop or click to select</p>
            </div>
        </div>
    );
};

export default ImageUploader;
