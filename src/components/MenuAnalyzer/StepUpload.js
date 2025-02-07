'use client';

import { useState, useRef } from 'react';
import { Upload, FileText, Image, RefreshCw } from 'lucide-react';

export default function StepUpload({ onUploadComplete, onStepComplete }) {
  const [inputType, setInputType] = useState('image');
  const [isUploading, setIsUploading] = useState(false);
  const [file, setFile] = useState(null);
  const [menuText, setMenuText] = useState('');
  const fileInputRef = useRef(null);

  const convertToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });
  };

  const handleUpload = async () => {
    setIsUploading(true);
    try {
      let data;
      if (inputType === 'image') {
        const base64Image = await convertToBase64(file);
        data = base64Image;
      } else {
        data = menuText;
      }
      
      // Pass the data back to parent
      await onUploadComplete(data);
      onStepComplete();
      
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (!selectedFile.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
      }
      if (selectedFile.size > 5 * 1024 * 1024) {
        alert('File size should be less than 5MB');
        return;
      }
      setFile(selectedFile);
    }
  };

  return (
    <section className="space-y-8">
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-black">Upload Your Menu</h2>
        <p className="text-gray-600 text-sm">Choose how you want to input your menu for analysis</p>
      </div>

      {/* Input Type Selection */}
      <div className="flex flex-col sm:flex-row gap-6">
        <button
          onClick={() => setInputType('image')}
          className={`flex-1 p-5 sm:p-6 rounded-lg text-left transition-all border-2 ${
            inputType === 'image'
              ? 'bg-white border-[#F4AF54] shadow-md'
              : 'bg-[#F6F6F6] text-gray-700 border-transparent hover:bg-gray-300'
          }`}
        >
          <Image className="w-6 h-6 mb-2 text-black" />
          <h3 className="font-bold text-sm">Upload Menu Image</h3>
          <p className="text-xs text-gray-600">Upload a photo or scan of your menu</p>
        </button>

        <button
          onClick={() => setInputType('text')}
          className={`flex-1 p-5 sm:p-6 rounded-lg text-left transition-all border-2 ${
            inputType === 'text'
              ? 'bg-white border-[#F4AF54] shadow-md'
              : 'bg-[#F6F6F6] text-gray-700 border-transparent hover:bg-gray-300'
          }`}
        >
          <FileText className="w-6 h-6 mb-2 text-black" />
          <h3 className="font-bold text-sm">Enter Menu Text</h3>
          <p className="text-xs text-gray-600">Paste or type your menu content</p>
        </button>
      </div>

      {/* Upload/Input Area */}
      <div
        className="border-2 border-dashed border-gray-300 text-center text-gray-600 rounded-lg bg-[#F6F6F6] flex flex-col justify-center items-center h-48 cursor-pointer p-0 m-0 w-full"
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/*"
          className="hidden"
        />
        {file ? (
          <div className="w-full h-full flex flex-col items-center justify-center">
            <div className="w-full h-full border rounded-lg overflow-hidden">
              <img
                src={URL.createObjectURL(file)}
                alt="Uploaded preview"
                className="w-full h-full object-cover"
              />
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                fileInputRef.current?.click();
              }}
              className="text-[#F4AF54] font-bold hover:text-[#e4983b] mt-2"
            >
              Choose different file
            </button>
          </div>
        ) : (
          <>
            <Upload className="w-8 h-8 mb-2 text-black" />
            <span className="text-sm">Click to upload or drag and drop</span>
          </>
        )}
      </div>

      {/* Analyze Button - Improved Styling */}
      <div className="flex justify-center mt-6">
        <button
          onClick={handleUpload}
          disabled={isUploading || (!file && !menuText)}
          className="w-full sm:w-auto px-8 py-3 rounded-full bg-[#212350] text-white font-bold transition-all hover:bg-opacity-90 disabled:bg-gray-200 disabled:text-gray-500 flex justify-center items-center"
        >
          {isUploading ? (
            <div className="flex items-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin" />
              Uploading...
            </div>
          ) : (
            'Analyze Menu'
          )}
        </button>
      </div>
    </section>
  );
}
