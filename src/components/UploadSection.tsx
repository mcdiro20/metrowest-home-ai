import React, { useState, useRef } from 'react';
import { Upload, Camera, QrCode, Image as ImageIcon, Sparkles, Loader2, AlertCircle, CheckCircle, Smartphone } from 'lucide-react';
import { getFileSizeDisplay } from '../utils/imageUtils';

interface UploadSectionProps {
  onFileUpload: (file: File) => void;
  isZipCodeApproved: boolean;
  isFileProcessing?: boolean;
  fileProcessingError?: string | null;
}

const UploadSection: React.FC<UploadSectionProps> = ({ 
  onFileUpload, 
  isZipCodeApproved, 
  isFileProcessing = false,
  fileProcessingError = null 
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!isZipCodeApproved || isFileProcessing) return;
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (!isZipCodeApproved || isFileProcessing) return;

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      onFileUpload(files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isZipCodeApproved || isFileProcessing) return;
    
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

        {/* Mobile-Specific Guidance */}
        {isZipCodeApproved && (
          <div className="mb-8 p-4 bg-blue-50 rounded-xl border border-blue-200 md:hidden">
            <div className="flex items-start gap-3">
              <Smartphone className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-semibold text-blue-900 mb-1">📱 iPhone Users</h4>
                <p className="text-sm text-blue-800">
                  For best results, take photos in good lighting. Large images will be automatically optimized for AI processing.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* File Processing Status */}
        {isFileProcessing && (
          <div className="mb-6 p-4 bg-blue-50 rounded-xl border border-blue-200">
            <div className="flex items-center gap-3">
              <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
              <div>
                <h4 className="font-semibold text-blue-900">Processing Your Image</h4>
                <p className="text-sm text-blue-800">Optimizing image for AI processing... This may take a moment for large files.</p>
              </div>
            </div>
          </div>
        )}

        {/* File Processing Error */}
        {fileProcessingError && (
          <div className="mb-6 p-4 bg-red-50 rounded-xl border border-red-200">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-semibold text-red-900 mb-1">Upload Error</h4>
                <p className="text-sm text-red-800">{fileProcessingError}</p>
                <button
                  onClick={() => setFileProcessingError(null)}
                  className="text-xs text-red-600 hover:text-red-800 underline mt-2"
                >
                  Try Again
                </button>
              </div>
            </div>
          </div>
        )}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Drag & Drop Upload */}
          <div
            className={`border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300 ${
              isZipCodeApproved && !isFileProcessing
                ? isDragging
                  ? 'border-blue-500 bg-blue-50 cursor-pointer'
                  : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50/50 cursor-pointer'
                : 'border-gray-200 bg-gray-50 opacity-60'
            }`}
            onDragOver={isZipCodeApproved && !isFileProcessing ? handleDragOver : undefined}
            onDragLeave={isZipCodeApproved && !isFileProcessing ? handleDragLeave : undefined}
            onDrop={isZipCodeApproved && !isFileProcessing ? handleDrop : undefined}
          >
            <div className="flex flex-col items-center">
              <div
                className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${
                  isZipCodeApproved && !isFileProcessing ? 'bg-blue-100' : 'bg-gray-200'
                }`}
              >
                {isFileProcessing ? (
                  <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                ) : (
                  <Upload
                    className={`w-8 h-8 ${
                      isZipCodeApproved ? 'text-blue-600' : 'text-gray-400'
                    }`}
                  />
                )}
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {isFileProcessing
                  ? 'Processing Image...'
                  : isZipCodeApproved
                    ? 'Drag & Drop Your Photo'
                    : 'ZIP Code Required'}
              </h3>
              <p className="text-gray-600 mb-6">
                {isFileProcessing
                  ? 'Optimizing for AI processing...'
                  : isZipCodeApproved
                    ? 'Or click to browse your files'
                    : 'Confirm your MetroWest location first'}
              </p>
              <button
                type="button"
                className={`font-medium px-6 py-3 rounded-lg transition-colors ${
                  isZipCodeApproved && !isFileProcessing
                    ? 'bg-blue-600 hover:bg-blue-700 text-white'
                    : 'bg-gray-300 text-gray-500'
                }`}
                onClick={isZipCodeApproved && !isFileProcessing ? () => fileInputRef.current?.click() : undefined}
                disabled={!isZipCodeApproved || isFileProcessing}
              >
                {isFileProcessing ? 'Processing...' : 'Choose File'}
              </button>
            </div>
          </div>

          {/* Other Upload Options */}
          <div className="space-y-6">
            {/* File Upload */}
            <button
              onClick={isZipCodeApproved && !isFileProcessing ? () => fileInputRef.current?.click() : undefined}
              disabled={!isZipCodeApproved || isFileProcessing}
              className={`w-full bg-white rounded-xl p-6 shadow-sm border border-gray-200 text-left transition-all duration-200 ${
                isZipCodeApproved && !isFileProcessing
                  ? 'hover:shadow-md hover:border-emerald-300 cursor-pointer'
                  : 'opacity-60'
              }`}
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center">
                  {isFileProcessing ? (
                    <Loader2 className="w-6 h-6 text-emerald-600 animate-spin" />
                  ) : (
                    <ImageIcon className="w-6 h-6 text-emerald-600" />
                  )}
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">
                    {isFileProcessing ? 'Processing Image...' : 'File Upload'}
                  </h4>
                  <p className="text-sm text-gray-600">
                    {isFileProcessing ? 'Optimizing for mobile...' : 'JPG, PNG, WebP, or HEIC files (max 5MB)'}
                  </p>
                </div>
              </div>
            </button>

            {/* Mobile Upload */}
            <button
              onClick={isZipCodeApproved && !isFileProcessing ? () => fileInputRef.current?.click() : undefined}
              disabled={!isZipCodeApproved || isFileProcessing}
              className={`w-full bg-white rounded-xl p-6 shadow-sm border border-gray-200 text-left transition-all duration-200 ${
                isZipCodeApproved && !isFileProcessing
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
                  <p className="text-sm text-gray-600">
                    {isFileProcessing ? 'Processing...' : 'Take a photo directly'}
                  </p>
                </div>
              </div>
            </button>

            {/* QR Code Upload */}
            <button
              onClick={isZipCodeApproved && !isFileProcessing ? () => fileInputRef.current?.click() : undefined}
              disabled={!isZipCodeApproved || isFileProcessing}
              className={`w-full bg-white rounded-xl p-6 shadow-sm border border-gray-200 text-left transition-all duration-200 ${
                isZipCodeApproved && !isFileProcessing
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
              <div className="mt-3 text-xs text-blue-700">
                <p>📱 <strong>Mobile users:</strong> Large images are automatically optimized for faster processing</p>
                <p>📏 <strong>Supported formats:</strong> JPEG, PNG, WebP, HEIC (max 5MB)</p>
              </div>
            </div>
          </div>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/webp,image/heic,image/heif"
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>
    </section>
  );
};

export default UploadSection;
