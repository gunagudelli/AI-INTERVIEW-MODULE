import React, { useState, useEffect } from 'react';

interface ConfigSettings {
  environment: 'local' | 'live';
  localUrl: string;
  liveUrl: string;
  currentBaseUrl: string;
}

const ConfigPage: React.FC = () => {
  const [config, setConfig] = useState<ConfigSettings>({
    environment: 'local',
    localUrl: 'http://localhost:3001',
    liveUrl: 'https://interviews-zadn.onrender.com',
    currentBaseUrl: 'https://interviews-zadn.onrender.com'
  });

  // Load config from localStorage on mount
  useEffect(() => {
    const savedConfig = localStorage.getItem('askoxy-config');
    if (savedConfig) {
      const parsed = JSON.parse(savedConfig);
      setConfig(parsed);
      // Update global base URL
      (window as any).ASKOXY_BASE_URL = parsed.currentBaseUrl;
    }
  }, []);

  // Save config and update global base URL
  const saveConfig = () => {
    const newBaseUrl = config.environment === 'local' ? config.localUrl : config.liveUrl;
    const updatedConfig = { ...config, currentBaseUrl: newBaseUrl };
    
    localStorage.setItem('askoxy-config', JSON.stringify(updatedConfig));
    (window as any).ASKOXY_BASE_URL = newBaseUrl;
    setConfig(updatedConfig);
    
    alert(`✅ Config saved! Base URL: ${newBaseUrl}`);
  };

  const testConnection = async () => {
    try {
      const testUrl = config.environment === 'local' ? config.localUrl : config.liveUrl;
      const response = await fetch(`${testUrl}/api/health`);
      
      if (response.ok) {
        const data = await response.json();
        alert(`✅ Connection successful!\nStatus: ${data.status}\nEnvironment: ${config.environment.toUpperCase()}`);
      } else {
        alert(`❌ Connection failed!\nStatus: ${response.status}`);
      }
    } catch (error) {
      alert(`❌ Connection error!\n${error}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-md p-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">🔧 Askoxy Configuration</h1>
        
        {/* Current Status */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-blue-800 mb-2">Current Settings</h3>
          <p><strong>Environment:</strong> {config.environment.toUpperCase()}</p>
          <p><strong>Base URL:</strong> {config.currentBaseUrl}</p>
        </div>

        {/* Environment Selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-3">Environment</label>
          <div className="space-y-3">
            <label className="flex items-center">
              <input
                type="radio"
                name="environment"
                value="local"
                checked={config.environment === 'local'}
                onChange={(e) => setConfig({...config, environment: 'local'})}
                className="mr-3"
              />
              <span className="font-medium">Local Development</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name="environment"
                value="live"
                checked={config.environment === 'live'}
                onChange={(e) => setConfig({...config, environment: 'live'})}
                className="mr-3"
              />
              <span className="font-medium">Live Production</span>
            </label>
          </div>
        </div>

        {/* URL Configuration */}
        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Local URL</label>
            <input
              type="text"
              value={config.localUrl}
              onChange={(e) => setConfig({...config, localUrl: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="http://localhost:3001"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Live URL</label>
            <input
              type="text"
              value={config.liveUrl}
              onChange={(e) => setConfig({...config, liveUrl: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="https://interviews-zadn.onrender.com"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-4">
          <button
            onClick={saveConfig}
            className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 font-medium"
          >
            💾 Save Configuration
          </button>
          <button
            onClick={testConnection}
            className="flex-1 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 font-medium"
          >
            🔍 Test Connection
          </button>
        </div>

        {/* Usage Instructions */}
        <div className="mt-8 bg-gray-50 rounded-lg p-4">
          <h3 className="font-semibold text-gray-800 mb-2">📝 Usage Instructions</h3>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• Select your environment (Local/Live)</li>
            <li>• Update URLs if needed</li>
            <li>• Click "Save Configuration" to apply</li>
            <li>• Use "Test Connection" to verify connectivity</li>
            <li>• Settings are automatically saved to localStorage</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ConfigPage;