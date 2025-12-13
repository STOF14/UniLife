import React from 'react';
import { Download } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export const SettingsPage = ({ exportData }: { exportData: () => void }) => (
  <div className="space-y-6">
    <h1 className="text-3xl font-semibold text-white">Settings</h1>
    <div className="bg-[#141414] border border-[#38383A] rounded-xl p-6">
      <h2 className="text-xl font-semibold text-white mb-6">Data Management</h2>
      <div className="space-y-4">
        <div className="flex items-center justify-between py-3 border-b border-[#38383A]">
          <div>
            <div className="text-sm font-medium text-white">Export Data</div>
            <div className="text-xs text-[#EBEBF599]">Download all your data as JSON</div>
          </div>
          <Button onClick={exportData}><Download size={16} className="mr-2" />Export</Button>
        </div>
      </div>
    </div>
  </div>
);
