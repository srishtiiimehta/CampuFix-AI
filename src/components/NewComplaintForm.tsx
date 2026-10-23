import React, { useState, useRef } from 'react';
import { 
  Sparkles, 
  Upload, 
  Image as ImageIcon, 
  X, 
  Camera, 
  Info,
  Droplet,
  Zap,
  Sparkle,
  Wifi,
  ChevronRight,
  AlertCircle
} from 'lucide-react';
import { SAMPLE_CAMPUS_PHOTOS, SamplePhotoPreset } from '../services/sampleImages';

interface NewComplaintFormProps {
  onSubmit: (complaintText: string, imageData?: { base64: string; mimeType: string } | null) => void;
  isLoading: boolean;
  onCancel: () => void;
}

export const NewComplaintForm: React.FC<NewComplaintFormProps> = ({
  onSubmit,
  isLoading,
  onCancel,
}) => {
  const [complaintText, setComplaintText] = useState('');
  const [selectedImage, setSelectedImage] = useState<{ base64: string; mimeType: string; name: string } | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const sampleScenarios = [
    {
      title: 'Library WiFi Dropout',
      text: 'The campus wifi in the main library 2nd floor keeps cutting out every 5 minutes while studying.',
      photoPresetId: 'wifi_drop'
    },
    {
      title: 'Chemistry Lab Pipe Leak',
      text: 'Water pipe is leaking heavily under the chemical rinse sink in Science Complex B room 104.',
      photoPresetId: 'pipe_leak'
    },
    {
      title: 'Hall 202 Flickering Light',
      text: 'The ceiling fluorescent lights in engineering hall lecture room 202 are strobing and humming loudly.',
      photoPresetId: 'light_flicker'
    },
    {
      title: 'Corridor Glass & Coffee Spill',
      text: 'Someone dropped a mug and spilled hot coffee all over the tile floor at the student center entrance.',
      photoPresetId: 'coffee_spill'
    }
  ];

  const handleApplyScenario = (scenario: typeof sampleScenarios[0]) => {
    setComplaintText(scenario.text);
    const preset = SAMPLE_CAMPUS_PHOTOS.find((p) => p.id === scenario.photoPresetId);
    if (preset) {
      setSelectedImage({
        base64: preset.dataUrl,
        mimeType: 'image/svg+xml',
        name: preset.name
      });
    }
  };

  const handleSelectPreset = (preset: SamplePhotoPreset) => {
    setSelectedImage({
      base64: preset.dataUrl,
      mimeType: 'image/svg+xml',
      name: preset.name
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMessage('Please upload a valid image file (JPG, PNG, WebP).');
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      setErrorMessage('Image size exceeds 8MB. Please select a smaller photo.');
      return;
    }

    setErrorMessage('');
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setSelectedImage({
        base64,
        mimeType: file.type,
        name: file.name
      });
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!complaintText.trim() && !selectedImage) {
      setErrorMessage('Please provide a description of the issue or upload a photo.');
      return;
    }
    setErrorMessage('');
    onSubmit(complaintText.trim(), selectedImage ? { base64: selectedImage.base64, mimeType: selectedImage.mimeType } : null);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="flex items-center gap-2 text-xs font-semibold text-teal-700 uppercase tracking-wider">
          <span>Step 1 of 4</span>
          <span aria-hidden="true">·</span>
          <span>Student Maintenance Intake</span>
        </div>
        <h1 className="text-xl md:text-2xl font-bold text-slate-900 mt-1">
          Report a Campus Maintenance Problem
        </h1>
        <p className="text-xs md:text-sm text-slate-500 mt-1">
          Describe what you see in everyday language. Gemini AI interprets informal complaints, spots visual defects, and checks whether essential details like building and room are present.
        </p>

        {/* 4 Allowed Categories Banner */}
        <div className="mt-4 p-3 rounded-lg bg-slate-50 border border-slate-200 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-700">
          <span className="font-semibold text-slate-900">Allowed Categories:</span>
          <span className="inline-flex items-center gap-1"><Droplet className="w-3.5 h-3.5 text-teal-600" /> Plumbing</span>
          <span className="inline-flex items-center gap-1"><Zap className="w-3.5 h-3.5 text-amber-500" /> Electricity</span>
          <span className="inline-flex items-center gap-1"><Sparkle className="w-3.5 h-3.5 text-emerald-600" /> Cleanliness</span>
          <span className="inline-flex items-center gap-1"><Wifi className="w-3.5 h-3.5 text-indigo-600" /> Internet Connectivity</span>
        </div>
      </div>

      {/* Quick Test Scenarios */}
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <div className="flex items-center justify-between mb-2.5">
          <div className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
            Quick Test Examples (Click to Autofill)
          </div>
          <span className="text-[11px] text-teal-700 font-medium">Includes sample photo</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {sampleScenarios.map((sc, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleApplyScenario(sc)}
              className="text-left p-3 rounded-lg border border-slate-200 hover:border-teal-400 hover:bg-teal-50/40 transition-all text-xs group cursor-pointer"
            >
              <div className="font-semibold text-slate-900 group-hover:text-teal-800 flex items-center justify-between">
                <span>{sc.title}</span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-teal-600" />
              </div>
              <p className="text-slate-500 text-[11px] mt-1 line-clamp-1">{sc.text}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Main Submission Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-slate-200 p-6 space-y-6">
        {/* Text Input */}
        <div>
          <label htmlFor="complaint-text" className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
            What is the problem? <span className="text-rose-500">*</span>
          </label>
          <textarea
            id="complaint-text"
            rows={4}
            value={complaintText}
            onChange={(e) => setComplaintText(e.target.value)}
            placeholder="E.g., Water is leaking fast from under the 2nd floor restroom sink in Johnson Hall, or wifi keeps dropping in the library east wing..."
            className="w-full p-3.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-sm text-slate-900 placeholder-slate-400 leading-relaxed"
          />
          <div className="flex items-center justify-between mt-1.5 text-xs text-slate-400">
            <span>Informal language, abbreviations, and typos are automatically understood.</span>
            <span>{complaintText.length} characters</span>
          </div>
        </div>

        {/* Optional Photo Attachment */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Supporting Photograph (Optional)
            </label>
            <span className="text-xs text-slate-400">Gemini extracts visual observations & safety hazards</span>
          </div>

          {selectedImage ? (
            <div className="relative rounded-lg border border-slate-300 p-3 bg-slate-50 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <img
                  src={selectedImage.base64}
                  alt="Complaint attachment"
                  className="w-16 h-16 object-cover rounded-md border border-slate-200"
                />
                <div>
                  <div className="text-xs font-semibold text-slate-900 truncate max-w-xs sm:max-w-sm">
                    {selectedImage.name}
                  </div>
                  <div className="text-[11px] text-teal-700 font-medium mt-0.5">
                    Ready for multimodal Gemini analysis
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedImage(null)}
                className="p-1.5 text-slate-400 hover:text-rose-600 rounded-md hover:bg-rose-50 transition-colors cursor-pointer"
                title="Remove photo"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {/* File Upload Box */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-200 hover:border-teal-400 hover:bg-slate-50/60 rounded-xl p-5 text-center cursor-pointer transition-colors"
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/jpeg,image/png,image/webp,image/svg+xml"
                  className="hidden"
                />
                <Camera className="w-7 h-7 text-slate-400 mx-auto mb-2" />
                <div className="text-xs font-medium text-slate-700">
                  Click to upload a photo from your phone or device
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  Supports JPG, PNG, WebP up to 8MB
                </div>
              </div>

              {/* Sample Campus Photo Presets */}
              <div>
                <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                  Or select a realistic campus sample photo:
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {SAMPLE_CAMPUS_PHOTOS.map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => handleSelectPreset(preset)}
                      className="p-2 rounded-lg border border-slate-200 hover:border-teal-500 hover:bg-teal-50/50 text-left transition-all text-xs cursor-pointer"
                    >
                      <div className="font-medium text-slate-800 text-[11px] truncate">{preset.name}</div>
                      <div className="text-[10px] text-slate-400 truncate">{preset.category}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Error message */}
        {errorMessage && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Submit Actions */}
        <div className="pt-2 flex items-center justify-between border-t border-slate-100">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={isLoading || (!complaintText.trim() && !selectedImage)}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white font-medium text-sm shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 cursor-pointer"
          >
            <Sparkles className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span>{isLoading ? 'Analyzing with Gemini...' : 'Analyze Complaint with Gemini'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
