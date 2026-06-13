"use client";

import QueueLevelIndicator from "./QueueLevelIndicator";
import { useTranslation } from "@/providers/TranslationProvider";

export default function QueueLevelIndicatorDemo() {
  const { t } = useTranslation();
  return (
    <div className="space-y-8 p-6 bg-slate-50 rounded-xl">
      <div>
        <h3 className="text-lg font-bold text-slate-900 mb-4">
          {t('common.appName')} QueueLevelIndicator Component Demo
        </h3>
        <p className="text-sm text-slate-600 mb-6">
          {t('traffic.queue')} level indicator with multiple sizes
        </p>
      </div>

      {/* Small Size */}
      <div>
        <h4 className="text-sm font-bold text-slate-700 mb-3">Small Size (sm)</h4>
        <div className="flex flex-wrap gap-3">
          <QueueLevelIndicator
            lane="north"
            queueLevel={0}
            greenDuration={7}
            vehicleCount={8}
            queueLength={25}
            size="sm"
          />
          <QueueLevelIndicator
            lane="south"
            queueLevel={1}
            greenDuration={10}
            vehicleCount={12}
            queueLength={15}
            size="sm"
          />
          <QueueLevelIndicator
            lane="east"
            queueLevel={2}
            greenDuration={15}
            vehicleCount={25}
            queueLength={8}
            size="sm"
          />
          <QueueLevelIndicator
            lane="west"
            queueLevel={0}
            greenDuration={7}
            vehicleCount={6}
            queueLength={30}
            size="sm"
          />
        </div>
        <p className="text-xs text-slate-500 mt-2">
          ✨ Hover untuk melihat tooltip dengan detail lengkap
        </p>
      </div>

      {/* Medium Size */}
      <div>
        <h4 className="text-sm font-bold text-slate-700 mb-3">Medium Size (md)</h4>
        <div className="flex flex-wrap gap-3">
          <QueueLevelIndicator
            lane="north"
            queueLevel={0}
            greenDuration={7}
            vehicleCount={8}
            queueLength={25}
            size="md"
            showDetails={true}
          />
          <QueueLevelIndicator
            lane="south"
            queueLevel={1}
            greenDuration={10}
            vehicleCount={12}
            queueLength={15}
            size="md"
            showDetails={true}
          />
          <QueueLevelIndicator
            lane="east"
            queueLevel={2}
            greenDuration={15}
            vehicleCount={25}
            queueLength={8}
            size="md"
            showDetails={true}
          />
        </div>
        <p className="text-xs text-slate-500 mt-2">
          ✨ Dengan showDetails={true} untuk menampilkan green duration
        </p>
      </div>

      {/* Medium Size without details */}
      <div>
        <h4 className="text-sm font-bold text-slate-700 mb-3">Medium Size (md) - Compact</h4>
        <div className="flex flex-wrap gap-3">
          <QueueLevelIndicator
            lane="north"
            queueLevel={0}
            greenDuration={7}
            size="md"
          />
          <QueueLevelIndicator
            lane="south"
            queueLevel={1}
            greenDuration={10}
            size="md"
          />
          <QueueLevelIndicator
            lane="east"
            queueLevel={2}
            greenDuration={15}
            size="md"
          />
        </div>
        <p className="text-xs text-slate-500 mt-2">
          ✨ Tanpa showDetails untuk tampilan lebih compact
        </p>
      </div>

      {/* Large Size */}
      <div>
        <h4 className="text-sm font-bold text-slate-700 mb-3">Large Size (lg)</h4>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <QueueLevelIndicator
            lane="north"
            queueLevel={0}
            greenDuration={7}
            vehicleCount={8}
            queueLength={25}
            size="lg"
          />
          <QueueLevelIndicator
            lane="south"
            queueLevel={1}
            greenDuration={10}
            vehicleCount={12}
            queueLength={15}
            size="lg"
          />
          <QueueLevelIndicator
            lane="east"
            queueLevel={2}
            greenDuration={15}
            vehicleCount={25}
            queueLength={8}
            size="lg"
          />
          <QueueLevelIndicator
            lane="west"
            queueLevel={0}
            greenDuration={7}
            vehicleCount={6}
            queueLength={30}
            size="lg"
          />
        </div>
        <p className="text-xs text-slate-500 mt-2">
          ✨ Full card dengan semua detail dan animasi hover
        </p>
      </div>

      {/* Usage Examples */}
      <div className="bg-white rounded-lg p-4 border border-slate-200">
        <h4 className="text-sm font-bold text-slate-700 mb-3">Usage Examples</h4>
        <div className="space-y-3 text-xs font-mono">
          <div className="bg-slate-50 p-3 rounded">
            <p className="text-slate-600 mb-1">// Small - Compact badge</p>
            <code className="text-blue-600">
              {`<QueueLevelIndicator
  lane="north"
  queueLevel={0}
  greenDuration={7}
  size="sm"
/>`}
            </code>
          </div>

          <div className="bg-slate-50 p-3 rounded">
            <p className="text-slate-600 mb-1">// Medium - With details</p>
            <code className="text-blue-600">
              {`<QueueLevelIndicator
  lane="south"
  queueLevel={1}
  greenDuration={10}
  vehicleCount={12}
  showDetails={true}
  size="md"
/>`}
            </code>
          </div>

          <div className="bg-slate-50 p-3 rounded">
            <p className="text-slate-600 mb-1">// Large - Full card</p>
            <code className="text-blue-600">
              {`<QueueLevelIndicator
  lane="east"
  queueLevel={2}
  greenDuration={15}
  vehicleCount={25}
  queueLength={8}
  size="lg"
/>`}
            </code>
          </div>
        </div>
      </div>

      {/* Props Documentation */}
      <div className="bg-white rounded-lg p-4 border border-slate-200">
        <h4 className="text-sm font-bold text-slate-700 mb-3">Props</h4>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-left py-2 px-3 font-bold text-slate-700">Prop</th>
                <th className="text-left py-2 px-3 font-bold text-slate-700">Type</th>
                <th className="text-left py-2 px-3 font-bold text-slate-700">Required</th>
                <th className="text-left py-2 px-3 font-bold text-slate-700">Description</th>
              </tr>
            </thead>
            <tbody className="text-slate-600">
              <tr className="border-b border-slate-100">
                <td className="py-2 px-3 font-mono">lane</td>
                <td className="py-2 px-3 font-mono">'north' | 'south' | 'east' | 'west'</td>
                <td className="py-2 px-3">✅</td>
                <td className="py-2 px-3">Lane direction</td>
              </tr>
              <tr className="border-b border-slate-100">
                <td className="py-2 px-3 font-mono">queueLevel</td>
                <td className="py-2 px-3 font-mono">0 | 1 | 2</td>
                <td className="py-2 px-3">✅</td>
                <td className="py-2 px-3">Queue level (0=Lancar, 1=Sedang, 2=Padat)</td>
              </tr>
              <tr className="border-b border-slate-100">
                <td className="py-2 px-3 font-mono">greenDuration</td>
                <td className="py-2 px-3 font-mono">number</td>
                <td className="py-2 px-3">✅</td>
                <td className="py-2 px-3">Green light duration in seconds</td>
              </tr>
              <tr className="border-b border-slate-100">
                <td className="py-2 px-3 font-mono">vehicleCount</td>
                <td className="py-2 px-3 font-mono">number</td>
                <td className="py-2 px-3">❌</td>
                <td className="py-2 px-3">Number of vehicles</td>
              </tr>
              <tr className="border-b border-slate-100">
                <td className="py-2 px-3 font-mono">queueLength</td>
                <td className="py-2 px-3 font-mono">number</td>
                <td className="py-2 px-3">❌</td>
                <td className="py-2 px-3">Queue length in cm</td>
              </tr>
              <tr className="border-b border-slate-100">
                <td className="py-2 px-3 font-mono">showDetails</td>
                <td className="py-2 px-3 font-mono">boolean</td>
                <td className="py-2 px-3">❌</td>
                <td className="py-2 px-3">Show green duration (md size only)</td>
              </tr>
              <tr className="border-b border-slate-100">
                <td className="py-2 px-3 font-mono">size</td>
                <td className="py-2 px-3 font-mono">'sm' | 'md' | 'lg'</td>
                <td className="py-2 px-3">❌</td>
                <td className="py-2 px-3">Component size (default: 'md')</td>
              </tr>
              <tr>
                <td className="py-2 px-3 font-mono">className</td>
                <td className="py-2 px-3 font-mono">string</td>
                <td className="py-2 px-3">❌</td>
                <td className="py-2 px-3">Additional CSS classes</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
