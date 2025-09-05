'use client'

import { useState, useMemo, useCallback } from 'react'
import ScenarioNode from './ScenarioNode'
import { MindMapData } from '../../types/scenarios'

interface ScenarioMindMapProps {
  data: MindMapData
  selectedSymbol: string
  session?: any
  marketData?: any
  isLoadingMarketData?: boolean
}

export default function ScenarioMindMap({ data, selectedSymbol, session, marketData, isLoadingMarketData }: ScenarioMindMapProps) {
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)
  const [evaluationResults, setEvaluationResults] = useState<{[key: string]: any}>({})

  const handleNodeSelect = useCallback((nodeId: string) => {
    setSelectedNodeId(selectedNodeId === nodeId ? null : nodeId)
  }, [selectedNodeId])

  // Callback to receive evaluation results from child components
  const handleEvaluationResult = useCallback((nodeId: string, result: any) => {
    setEvaluationResults(prev => ({
      ...prev,
      [nodeId]: result
    }))
  }, [])

  // Group scenarios by their evaluation status
  const groupedScenarios = useMemo(() => {
    const groups = {
      bullish: [] as any[],
      bearish: [] as any[],
      noBias: [] as any[],
      notEvaluated: [] as any[]
    }

    data.nodes.forEach((node) => {
      const evaluation = evaluationResults[node.id]
      
      if (!evaluation || !evaluation.status) {
        // No evaluation yet
        groups.notEvaluated.push({ ...node, evaluation })
      } else {
        switch (evaluation.status) {
          case 'BULLISH':
            groups.bullish.push({ ...node, evaluation })
            break
          case 'BEARISH':
            groups.bearish.push({ ...node, evaluation })
            break
          case 'NO_BIAS':
            groups.noBias.push({ ...node, evaluation })
            break
          default:
            // Handle any other status values
            groups.noBias.push({ ...node, evaluation })
        }
      }
    })

    return groups
  }, [data.nodes, evaluationResults])

  return (
    <div className="h-full overflow-auto custom-scrollbar">
      <div className="p-6 space-y-8 max-w-full">
        
        {/* BULLISH SCENARIOS */}
        {groupedScenarios.bullish.length > 0 && (
          <div className="w-full">
            <h2 className="text-2xl font-bold text-green-400 mb-6 flex items-center">
              📈 BULLISH SCENARIOS
              <span className="ml-3 text-sm bg-green-900/50 px-3 py-1 rounded-full">
                {groupedScenarios.bullish.length}
              </span>
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 w-full">
              {groupedScenarios.bullish.map((node) => (
                <ScenarioNode
                  key={node.id}
                  node={node}
                  isSelected={selectedNodeId === node.id}
                  onSelect={() => handleNodeSelect(node.id)}
                  selectedSymbol={selectedSymbol}
                  session={session}
                  marketData={marketData}
                  isLoadingMarketData={isLoadingMarketData}
                  onEvaluationResult={(result) => handleEvaluationResult(node.id, result)}
                />
              ))}
            </div>
          </div>
        )}

        {/* BEARISH SCENARIOS */}
        {groupedScenarios.bearish.length > 0 && (
          <div className="w-full">
            <h2 className="text-2xl font-bold text-red-400 mb-6 flex items-center">
              📉 BEARISH SCENARIOS
              <span className="ml-3 text-sm bg-red-900/50 px-3 py-1 rounded-full">
                {groupedScenarios.bearish.length}
              </span>
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 w-full">
              {groupedScenarios.bearish.map((node) => (
                <ScenarioNode
                  key={node.id}
                  node={node}
                  isSelected={selectedNodeId === node.id}
                  onSelect={() => handleNodeSelect(node.id)}
                  selectedSymbol={selectedSymbol}
                  session={session}
                  marketData={marketData}
                  isLoadingMarketData={isLoadingMarketData}
                  onEvaluationResult={(result) => handleEvaluationResult(node.id, result)}
                />
              ))}
            </div>
          </div>
        )}

        {/* NO BIAS SCENARIOS */}
        {groupedScenarios.noBias.length > 0 && (
          <div className="w-full">
            <h2 className="text-2xl font-bold text-yellow-400 mb-6 flex items-center">
              ⚖️ NO BIAS SCENARIOS
              <span className="ml-3 text-sm bg-yellow-900/50 px-3 py-1 rounded-full">
                {groupedScenarios.noBias.length}
              </span>
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 w-full">
              {groupedScenarios.noBias.map((node) => (
                <ScenarioNode
                  key={node.id}
                  node={node}
                  isSelected={selectedNodeId === node.id}
                  onSelect={() => handleNodeSelect(node.id)}
                  selectedSymbol={selectedSymbol}
                  session={session}
                  marketData={marketData}
                  isLoadingMarketData={isLoadingMarketData}
                  onEvaluationResult={(result) => handleEvaluationResult(node.id, result)}
                />
              ))}
            </div>
          </div>
        )}

        {/* NOT EVALUATED SCENARIOS */}
        {groupedScenarios.notEvaluated.length > 0 && (
          <div className="w-full">
            <h2 className="text-2xl font-bold text-gray-400 mb-6 flex items-center">
              ⏳ PENDING EVALUATION
              <span className="ml-3 text-sm bg-gray-900/50 px-3 py-1 rounded-full">
                {groupedScenarios.notEvaluated.length}
              </span>
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 w-full">
              {groupedScenarios.notEvaluated.map((node) => (
                <ScenarioNode
                  key={node.id}
                  node={node}
                  isSelected={selectedNodeId === node.id}
                  onSelect={() => handleNodeSelect(node.id)}
                  selectedSymbol={selectedSymbol}
                  session={session}
                  marketData={marketData}
                  isLoadingMarketData={isLoadingMarketData}
                  onEvaluationResult={(result) => handleEvaluationResult(node.id, result)}
                />
              ))}
            </div>
          </div>
        )}


      </div>
    </div>
  )
}
