'use client'

import { useState } from 'react'
import { PlusIcon, TrashIcon, CurrencyDollarIcon, ChartBarIcon } from '@heroicons/react/24/outline'
import { TradeZone } from '../../types/scenarios'

interface TradeZonesProps {
  zones: TradeZone[]
  onZonesChange: (zones: TradeZone[]) => void
  className?: string
  readOnly?: boolean
}

export default function TradeZones({ zones, onZonesChange, className = '', readOnly = false }: TradeZonesProps) {
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingZone, setEditingZone] = useState<TradeZone | null>(null)

  const addZone = () => {
    if (readOnly) return
    
    const newZone: TradeZone = {
      id: `zone-${Date.now()}`,
      type: 'BUY',
      entryPrice: '0',
      stopLoss: '0',
      takeProfit: '0',
      description: ''
    }
    onZonesChange([...zones, newZone])
    setShowAddForm(false)
    setEditingZone(null)
  }

  const updateZone = (id: string, updates: Partial<TradeZone>) => {
    if (readOnly) return
    
    const updatedZones = zones.map(zone =>
      zone.id === id ? { ...zone, ...updates } : zone
    )
    onZonesChange(updatedZones)
  }

  const deleteZone = (id: string) => {
    if (readOnly) return
    
    const updatedZones = zones.filter(zone => zone.id !== id)
    onZonesChange(updatedZones)
  }

  const toggleZone = (id: string) => {
    if (readOnly) return
    // Note: isActive field not available in TradeZone interface
  }

  // Helper function to convert string/number to number
  const toNumber = (value: string | number): number => {
    if (typeof value === 'number') return value
    return parseFloat(value) || 0
  }

  const calculateRisk = (zone: TradeZone) => {
    const entryPrice = toNumber(zone.entryPrice)
    const stopLoss = toNumber(zone.stopLoss)
    
    if (zone.type === 'BUY') {
      const riskPerShare = entryPrice - stopLoss
      const accountRisk = (riskPerShare / entryPrice) * 100
      return Math.abs(accountRisk).toFixed(2)
    } else {
      const riskPerShare = stopLoss - entryPrice
      const accountRisk = (riskPerShare / entryPrice) * 100
      return Math.abs(accountRisk).toFixed(2)
    }
  }

  const calculateReward = (zone: TradeZone) => {
    const entryPrice = toNumber(zone.entryPrice)
    const takeProfit = toNumber(zone.takeProfit)
    
    if (zone.type === 'BUY') {
      const rewardPerShare = takeProfit - entryPrice
      const accountReward = (rewardPerShare / entryPrice) * 100
      return Math.abs(accountReward).toFixed(2)
    } else {
      const rewardPerShare = entryPrice - takeProfit
      const accountReward = (rewardPerShare / entryPrice) * 100
      return Math.abs(accountReward).toFixed(2)
    }
  }

  const getRiskRewardRatio = (zone: TradeZone) => {
    const risk = parseFloat(calculateRisk(zone))
    const reward = parseFloat(calculateReward(zone))
    return risk > 0 ? (reward / risk).toFixed(2) : '0.00'
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">Trade Zones</h3>
        {!readOnly && (
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
          >
            <PlusIcon className="w-4 h-4" />
            <span>Add Trade Zone</span>
          </button>
        )}
      </div>

      {!readOnly && showAddForm && (
        <div className="p-4 bg-gray-800 border border-gray-600 rounded-lg">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Type</label>
              <select
                value={editingZone?.type || 'BUY'}
                onChange={(e) => setEditingZone(prev => prev ? { ...prev, type: e.target.value as 'BUY' | 'SELL' } : null)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white text-sm"
              >
                <option value="BUY">Buy Zone</option>
                <option value="SELL">Sell Zone</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Entry Price</label>
              <input
                type="number"
                step="0.01"
                value={editingZone?.entryPrice || '0'}
                onChange={(e) => setEditingZone(prev => prev ? { ...prev, entryPrice: e.target.value } : null)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white text-sm"
                placeholder="0.00"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Stop Loss</label>
              <input
                type="number"
                step="0.01"
                value={editingZone?.stopLoss || '0'}
                onChange={(e) => setEditingZone(prev => prev ? { ...prev, stopLoss: e.target.value } : null)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white text-sm"
                placeholder="0.00"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Take Profit</label>
              <input
                type="number"
                step="0.01"
                value={editingZone?.takeProfit || '0'}
                onChange={(e) => setEditingZone(prev => prev ? { ...prev, takeProfit: e.target.value } : null)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white text-sm"
                placeholder="0.00"
              />
            </div>


            <div className="md:col-span-2 lg:col-span-3">
              <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
              <input
                type="text"
                value={editingZone?.description || ''}
                onChange={(e) => setEditingZone(prev => prev ? { ...prev, description: e.target.value } : null)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white text-sm"
                placeholder="Describe this trade zone..."
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3 mt-4">
            <button
              onClick={() => setShowAddForm(false)}
              className="px-4 py-2 text-gray-300 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={addZone}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
            >
              Add Zone
            </button>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {zones.map((zone) => (
          <div
            key={zone.id}
            className={`p-4 border rounded-lg transition-all ${
              zone.type === 'BUY'
                ? 'bg-green-900/20 border-green-600/50'
                : 'bg-red-900/20 border-red-600/50'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-3">
                {!readOnly && (
                  <button
                    onClick={() => toggleZone(zone.id)}
                    className="w-4 h-4 rounded border-2 transition-colors bg-green-500 border-green-500"
                  />
                )}
                <div className="flex items-center space-x-2">
                  <span className={`text-sm font-medium ${
                    zone.type === 'BUY' ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {zone.type === 'BUY' ? 'BUY' : 'SELL'} Zone
                  </span>
                  {zone.description && (
                    <span className="text-sm text-gray-300">- {zone.description}</span>
                  )}
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-xs text-gray-400">Risk: {calculateRisk(zone)}%</span>
                <span className="text-xs text-gray-400">R:R {getRiskRewardRatio(zone)}</span>
                {!readOnly && (
                  <button
                    onClick={() => deleteZone(zone.id)}
                    className="text-red-400 hover:text-red-300 transition-colors"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
              <div className="flex items-center space-x-2">
                <CurrencyDollarIcon className="w-4 h-4 text-gray-400" />
                <div>
                  <span className="text-gray-400">Entry:</span>
                  <span className="ml-2 text-white">${toNumber(zone.entryPrice).toFixed(2)}</span>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <ChartBarIcon className="w-4 h-4 text-gray-400" />
                <div>
                  <span className="text-gray-400">Stop:</span>
                  <span className="ml-2 text-white">${toNumber(zone.stopLoss).toFixed(2)}</span>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <ChartBarIcon className="w-4 h-4 text-gray-400" />
                <div>
                  <span className="text-gray-400">Target:</span>
                  <span className="ml-2 text-white">${toNumber(zone.takeProfit).toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div className="mt-3 pt-3 border-t border-gray-600">
              <div className="flex justify-between text-xs">
                <span className="text-gray-400">Risk: {calculateRisk(zone)}%</span>
                <span className="text-gray-400">Reward: {calculateReward(zone)}%</span>
                <span className="text-gray-400">Risk/Reward: {getRiskRewardRatio(zone)}</span>
              </div>
            </div>
          </div>
        ))}

        {zones.length === 0 && (
          <div className="text-center py-8 text-gray-400">
            <CurrencyDollarIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No trade zones configured yet.</p>
            <p className="text-sm">Trade zones are defined in the scenario configuration files.</p>
          </div>
        )}
      </div>
    </div>
  )
}
