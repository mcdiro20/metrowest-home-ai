import React, { useState } from 'react';
import { Eye, Copy, Check } from 'lucide-react';

const EnvDisplay: React.FC = () => {
  const [showValues, setShowValues] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const envVars = {
    VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
    VITE_SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY,
    VITE_OPENAI_API_KEY: import.meta.env.VITE_OPENAI_API_KEY
  };

  const copyToClipboard = async (key: string, value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const maskValue = (value: string) => {
    if (!value) return 'NOT SET';
    if (value.startsWith('https://')) {
      return value; // URLs are safe to show
    }
    return value.substring(0, 10) + '...';
  };

  return (
    <div className="fixed top-4 left-4 z-50 bg-white rounded-lg shadow-lg border border-gray-200 p-4 max-w-md">
      <div className="flex items-center gap-2 mb-4">
        <Eye className="w-5 h-5 text-blue-600" />
        <h3 className="font-semibold text-gray-900">Environment Variables</h3>
      </div>
      
      <div className="space-y-3">
        {Object.entries(envVars).map(([key, value]) => (
          <div key={key} className="border border-gray-200 rounded p-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium text-gray-700">{key}</span>
              {value && (
                <button
                  onClick={() => copyToClipboard(key, value)}
                  className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
                >
                  {copiedKey === key ? (
                    <>
                      <Check className="w-3 h-3" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      Copy
                    </>
                  )}
                </button>
              )}
            </div>
            <div className="text-xs font-mono bg-gray-50 p-2 rounded">
              {showValues ? (value || 'NOT SET') : maskValue(value || '')}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 flex gap-2">
        <button
          onClick={() => setShowValues(!showValues)}
          className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded transition-colors"
        >
          {showValues ? 'Hide Values' : 'Show Full Values'}
        </button>
      </div>

      <div className="mt-3 text-xs text-gray-500">
        <p><strong>For Vercel:</strong> Copy these values to your Vercel project's Environment Variables section.</p>
        <p className="mt-1"><strong>Service Role Key:</strong> You'll need to get this from your Supabase dashboard → Settings → API</p>
      </div>
    </div>
  );
};

export default EnvDisplay;