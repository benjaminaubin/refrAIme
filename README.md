# RefrAIme

**RefrAIme** is a simple web application designed for intelligent image cropping and AI-powered outpainting (uncropping). By utilizing the advanced Clipdrop API, it allows users to extend images beyond their original boundaries, generating high-quality AI content that blends seamlessly with the original image.

![RefrAIme Demo](src/assets/demo.gif)

## ✨ Features

- **🎯 Precision Cropping:** A fluid, high-performance interface for standard cropping with real-time dimension monitoring.
- **🪄 AI Outpainting (Uncrop):** Extend your photos in any direction with state-of-the-art AI. Use it to expand landscapes, fix tight crops, or adapt images for different social media aspect ratios.
- **⚖️ Flexible Aspect Ratios:** 
  - Presets for 1:1, 4:3, 16:9, 9:16, and 5:4.
  - Manual pixel-perfect dimension input.
  - "Free" mode for total creative control.

## 🛠️ Tech Stack

- **Core:** [React 19](https://react.dev/), [Vite](https://vitejs.dev/)
- **State Management:** React Hooks
- **Icons:** [Lucide React](https://lucide.dev/)
- **Image Engine:** [react-image-crop](https://github.com/DominicTobias/react-image-crop) & Canvas API
- **AI Integration:** [Clipdrop API](https://clipdrop.co/apis)

## 🚀 Getting Started

### Prerequisites

- A **Clipdrop API Key** (Get yours at [clipdrop.co/apis](https://clipdrop.co/apis)).
- **Node.js** installed on your machine.

### Installation & Run

1. Clone the repository and navigate to the project folder.
2. Install dependencies:
   ```shell
   npm install
   ```
3. Start the development server:
   ```shell
   npm run dev
   ```
4. Open the application at `http://localhost:5173`.

## 💡 How to "Uncrop"

1. **Upload an image** via selection or drag-and-drop.
2. **Adjust the crop area** so it extends past the original image edges (into the checkerboard area).
3. **Uncrop mode** will automatically activate, changing the action button to a magic wand.
4. **Enter your API Key** in the field that appears below the image.
5. **Click Uncrop** and let the AI generate the rest of your image!# refrAIme
