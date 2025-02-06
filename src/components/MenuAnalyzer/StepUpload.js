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
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">Upload Your Menu</h2>
        <p className="text-gray-600">Choose how you want to input your menu for analysis</p>
      </div>

      {/* Input Type Selection */}
      <div className="grid grid-cols-2 gap-6">
        <button
          onClick={() => setInputType('image')}
          className={`p-4 rounded-lg border-2 transition-all ${
            inputType === 'image'
              ? 'border-[#e4983b] bg-orange-50'
              : 'border-gray-200 hover:border-gray-300'
          }`}
        >
          <Image className="w-6 h-6 mb-2" />
          <h3 className="font-medium">Upload Menu Image</h3>
          <p className="text-sm text-gray-600">Upload a photo or scan of your menu</p>
        </button>

        <button
          onClick={() => setInputType('text')}
          className={`p-4 rounded-lg border-2 transition-all ${
            inputType === 'text'
              ? 'border-[#e4983b] bg-orange-50'
              : 'border-gray-200 hover:border-gray-300'
          }`}
        >
          <FileText className="w-6 h-6 mb-2" />
          <h3 className="font-medium">Enter Menu Text</h3>
          <p className="text-sm text-gray-600">Paste or type your menu content</p>
        </button>
      </div>

      {/* Upload/Input Area */}
      <div className="mt-6">
        {inputType === 'image' ? (
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
              className="hidden"
            />
            {file ? (
              <div className="space-y-4">
                <p className="text-gray-700">{file.name}</p>
                <img
                  src={URL.createObjectURL(file)}
                  alt="Uploaded preview"
                  className="max-w-full h-auto rounded-lg"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="text-orange-500 hover:text-orange-600"
                >
                  Choose different file
                </button>
              </div>
            ) : (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="text-gray-600 hover:text-gray-800"
              >
                <Upload className="w-8 h-8 mx-auto mb-2" />
                <span>Click to upload or drag and drop</span>
              </button>
            )}
          </div>
        ) : (
          <textarea
            value={menuText}
            onChange={(e) => setMenuText(e.target.value)}
            placeholder="Paste your menu content here..."
            className="w-full h-64 p-4 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          />
        )}
      </div>

      {/* Submit Button */}
      <div className="flex justify-end">
        <button
          onClick={handleUpload}
          disabled={isUploading || (!file && !menuText)}
          className={`px-6 py-2.5 rounded-lg flex items-center gap-2 transition-all ${
            isUploading || (!file && !menuText)
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-gradient-to-r from-[#e4983b] to-[#f5bf66] text-white hover:opacity-90'
          }`}
        >
          {isUploading ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              Uploading...
            </>
          ) : (
            'Analyze Menu'
          )}
        </button>
      </div>
    </section>
  );
} 