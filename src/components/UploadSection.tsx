import React, { useState, useRef } from 'react';
import { Upload, Camera, QrCode, Image as ImageIcon, Sparkles } from 'lucide-react';

interface UploadSectionProps {
  onFileUpload: (file: File) => void;
  isZipCodeApproved: boolean;
}

const UploadSection: React.FC<UploadSectionProps> = ({ onFileUpload, isZipCodeApproved }) => {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      onFileUpload(files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFileUpload(e.target.files[0]);
    }
  };


  return (
    <section
      id="upload-section"
      className="py-20 bg-gradient-to-br from-gray-50 to-blue-50"
    >
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Upload Your Space
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            {isZipCodeApproved
              ? 'Drag and drop a photo of your kitchen or backyard—or snap a photo and upload it. Our AI will generate a stunning reimagined version.'
              : 'Please confirm your ZIP code above to upload your photo and access our AI design service.'}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Drag & Drop Upload */}
          <div
            className={`border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300 ${
              isZipCodeApproved
                ? isDragging
                  ? 'border-blue-500 bg-blue-50 cursor-pointer'
                  : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50/50 cursor-pointer'
                : 'border-gray-200 bg-gray-50 opacity-60'
            }`}
            onDragOver={isZipCodeApproved ? handleDragOver : undefined}
            onDragLeave={isZipCodeApproved ? handleDragLeave : undefined}
            onDrop={isZipCodeApproved ? handleDrop : undefined}
          >
            <div className="flex flex-col items-center">
              <div
                className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${
                  isZipCodeApproved ? 'bg-blue-100' : 'bg-gray-200'
                }`}
              >
                <Upload
                  className={`w-8 h-8 ${
                    isZipCodeApproved ? 'text-blue-600' : 'text-gray-400'
                  }`}
                />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {isZipCodeApproved
                  ? 'Drag & Drop Your Photo'
                  : 'ZIP Code Required'}
              </h3>
              <p className="text-gray-600 mb-6">
                {isZipCodeApproved
                  ? 'Or click to browse your files'
                  : 'Confirm your MetroWest location first'}
              </p>
              <button
                type="button"
                className={`font-medium px-6 py-3 rounded-lg transition-colors ${
                  isZipCodeApproved
                    ? 'bg-blue-600 hover:bg-blue-700 text-white'
                    : 'bg-gray-300 text-gray-500'
                }`}
                onClick={isZipCodeApproved ? () => fileInputRef.current?.click() : undefined}
                disabled={!isZipCodeApproved}
              >
                Choose File
              </button>
            </div>
          </div>

          {/* Other Upload Options */}
          <div className="space-y-6">
            {/* File Upload */}
            <button
              onClick={isZipCodeApproved ? () => fileInputRef.current?.click() : undefined}
              disabled={!isZipCodeApproved}
              className={`w-full bg-white rounded-xl p-6 shadow-sm border border-gray-200 text-left transition-all duration-200 ${
                isZipCodeApproved
                  ? 'hover:shadow-md hover:border-emerald-300 cursor-pointer'
                  : 'opacity-60'
              }`}
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center">
                  <ImageIcon className="w-6 h-6 text-emerald-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">File Upload</h4>
                  <p className="text-sm text-gray-600">JPG, PNG, or HEIC files</p>
                </div>
              </div>
            </button>

            {/* Mobile Upload */}
            <button
              onClick={isZipCodeApproved ? () => fileInputRef.current?.click() : undefined}
              disabled={!isZipCodeApproved}
              className={`w-full bg-white rounded-xl p-6 shadow-sm border border-gray-200 text-left transition-all duration-200 ${
                isZipCodeApproved
                  ? 'hover:shadow-md hover:border-purple-300 cursor-pointer'
                  : 'opacity-60'
              }`}
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                  <Camera className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">Mobile Upload</h4>
                  <p className="text-sm text-gray-600">Take a photo directly</p>
                </div>
              </div>
            </button>

            {/* QR Code Upload */}
            <button
              onClick={isZipCodeApproved ? () => fileInputRef.current?.click() : undefined}
              disabled={!isZipCodeApproved}
              className={`w-full bg-white rounded-xl p-6 shadow-sm border border-gray-200 text-left transition-all duration-200 ${
                isZipCodeApproved
                  ? 'hover:shadow-md hover:border-orange-300 cursor-pointer'
                  : 'opacity-60'
              }`}
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                  <QrCode className="w-6 h-6 text-orange-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">QR Code Upload</h4>
                  <p className="text-sm text-gray-600">
                    Scan to upload from mobile
                  </p>
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* Info Box */}
        <div className="mt-12 p-6 bg-blue-50 rounded-xl border border-blue-200">
          <div className="flex items-start gap-4">
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <h4 className="font-semibold text-blue-900 mb-2">
                AI Render Process
              </h4>
              <p className="text-blue-800">
                Once you upload your photo, our AI will generate a reimagined
                version of your space. The preview will be blurred—enter your
                email to receive the full high-resolution image.
              </p>
            </div>
          </div>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>
    </section>
  );
};

export default UploadSection;
