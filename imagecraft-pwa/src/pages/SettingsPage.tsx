/**
 * Settings Page Component
 * Application and user preference settings
 */

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  Settings, 
  Bell, 
  Shield, 
  Palette, 
  Download,
  Monitor,
  Moon,
  Sun,
  Smartphone
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Switch } from '../components/ui/switch.tsx';

const SettingsPage: React.FC = () => {
  
  // Settings state
  const [settings, setSettings] = useState({
    notifications: {
      email: true,
      push: true,
      processing: true,
      marketing: false
    },
    appearance: {
      theme: 'light',
      highContrast: false,
      reducedMotion: false
    },
    privacy: {
      analytics: true,
      crashReports: true,
      usageData: false
    },
    processing: {
      autoOptimize: true,
      preserveMetadata: true,
      maxFileSize: '10MB'
    }
  });

  const updateSetting = (category: string, key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category as keyof typeof prev],
        [key]: value
      }
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-cream-50 to-orange-25 relative overflow-hidden">
      {/* Background decorative elements - light and elegant */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
        <div className="absolute top-1/5 right-1/6 w-40 h-40 bg-orange-200/20 rounded-full blur-3xl animate-gentle-breathe"></div>
        <div className="absolute bottom-1/4 left-1/5 w-28 h-28 bg-cream-200/25 rounded-full blur-2xl animate-gentle-breathe delay-1000"></div>
        <div className="absolute top-1/2 right-1/3 w-20 h-20 bg-orange-100/30 rounded-full blur-xl animate-float2"></div>
      </div>
      {/* Header */}
      <div className="card-glass-cream-accessible mx-4 mt-4 mb-8 shadow-lg border border-white/30 relative z-10">
        <div className="flex items-center justify-between p-6">
          <div className="flex items-center space-x-4">
            <Link to="/">
              <Button
                variant="ghost"
                size="sm"
                className="card-glass-peach-accessible text-gray-700 hover:text-orange-600 border-0 shadow-sm"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Home
              </Button>
            </Link>
            <div className="h-6 w-px bg-gray-300/50"></div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center">
              <Settings className="w-6 h-6 mr-2 text-orange-600" />
              Settings
            </h1>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 pb-8 relative z-10">
        <div className="space-y-6">
          {/* Notifications */}
          <Card className="card-glass-cream-accessible border border-white/30 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Bell className="w-5 h-5 mr-2 text-blue-600" />
                Notifications
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-gray-900">Email notifications</h3>
                  <p className="text-sm text-gray-600">Receive updates via email</p>
                </div>
                <Switch 
                  checked={settings.notifications.email}
                  onCheckedChange={(checked) => updateSetting('notifications', 'email', checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-gray-900">Push notifications</h3>
                  <p className="text-sm text-gray-600">Browser push notifications</p>
                </div>
                <Switch 
                  checked={settings.notifications.push}
                  onCheckedChange={(checked) => updateSetting('notifications', 'push', checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-gray-900">Processing complete</h3>
                  <p className="text-sm text-gray-600">Notify when image processing is done</p>
                </div>
                <Switch 
                  checked={settings.notifications.processing}
                  onCheckedChange={(checked) => updateSetting('notifications', 'processing', checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-gray-900">Marketing emails</h3>
                  <p className="text-sm text-gray-600">Tips, updates, and new features</p>
                </div>
                <Switch 
                  checked={settings.notifications.marketing}
                  onCheckedChange={(checked) => updateSetting('notifications', 'marketing', checked)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Appearance */}
          <Card className="card-glass-cream-accessible border border-white/30 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Palette className="w-5 h-5 mr-2 text-purple-600" />
                Appearance
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div>
                <h3 className="font-medium text-gray-900 mb-3">Theme</h3>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { value: 'light', icon: Sun, label: 'Light' },
                    { value: 'dark', icon: Moon, label: 'Dark' },
                    { value: 'system', icon: Monitor, label: 'System' }
                  ].map((theme) => (
                    <button
                      key={theme.value}
                      onClick={() => updateSetting('appearance', 'theme', theme.value)}
                      className={`card-glass-peach-accessible p-4 text-center transition-all shadow-sm border border-white/20 ${
                        settings.appearance.theme === theme.value
                          ? 'ring-2 ring-orange-500 bg-orange-50/70'
                          : 'hover:bg-white/40'
                      }`}
                    >
                      <theme.icon className="w-6 h-6 mx-auto mb-2" />
                      <span className="text-sm font-medium">{theme.label}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-gray-900">High contrast mode</h3>
                  <p className="text-sm text-gray-600">Improve accessibility with higher contrast</p>
                </div>
                <Switch 
                  checked={settings.appearance.highContrast}
                  onCheckedChange={(checked) => updateSetting('appearance', 'highContrast', checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-gray-900">Reduce motion</h3>
                  <p className="text-sm text-gray-600">Minimize animations and transitions</p>
                </div>
                <Switch 
                  checked={settings.appearance.reducedMotion}
                  onCheckedChange={(checked) => updateSetting('appearance', 'reducedMotion', checked)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Privacy & Security */}
          <Card className="card-glass-cream-accessible border border-white/30 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Shield className="w-5 h-5 mr-2 text-green-600" />
                Privacy & Security
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-gray-900">Anonymous analytics</h3>
                  <p className="text-sm text-gray-600">Help improve the app with usage data</p>
                </div>
                <Switch 
                  checked={settings.privacy.analytics}
                  onCheckedChange={(checked) => updateSetting('privacy', 'analytics', checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-gray-900">Crash reports</h3>
                  <p className="text-sm text-gray-600">Automatically send error reports</p>
                </div>
                <Switch 
                  checked={settings.privacy.crashReports}
                  onCheckedChange={(checked) => updateSetting('privacy', 'crashReports', checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-gray-900">Usage data collection</h3>
                  <p className="text-sm text-gray-600">Share feature usage patterns</p>
                </div>
                <Switch 
                  checked={settings.privacy.usageData}
                  onCheckedChange={(checked) => updateSetting('privacy', 'usageData', checked)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Processing Defaults */}
          <Card className="card-glass-cream-accessible border border-white/30 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Settings className="w-5 h-5 mr-2 text-orange-600" />
                Processing Defaults
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-gray-900">Auto-optimize images</h3>
                  <p className="text-sm text-gray-600">Automatically apply quality optimizations</p>
                </div>
                <Switch 
                  checked={settings.processing.autoOptimize}
                  onCheckedChange={(checked) => updateSetting('processing', 'autoOptimize', checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-gray-900">Preserve metadata</h3>
                  <p className="text-sm text-gray-600">Keep EXIF data in processed images</p>
                </div>
                <Switch 
                  checked={settings.processing.preserveMetadata}
                  onCheckedChange={(checked) => updateSetting('processing', 'preserveMetadata', checked)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Data Management */}
          <Card className="card-glass-cream-accessible border border-white/30 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Download className="w-5 h-5 mr-2 text-indigo-600" />
                Data Management
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                <Button 
                  variant="outline" 
                  className="w-full justify-start card-glass-peach-accessible border border-white/30 shadow-sm"
                >
                  <Download className="w-4 h-4 mr-3" />
                  Export My Data
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start card-glass-peach-accessible border border-white/30 shadow-sm"
                >
                  <Smartphone className="w-4 h-4 mr-3" />
                  Clear Cache
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Save Button */}
          <div className="flex justify-end pt-6">
            <Button className="btn-glass-orange-accessible text-white font-semibold py-2 px-6 shadow-lg hover:shadow-xl">
              Save Settings
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;