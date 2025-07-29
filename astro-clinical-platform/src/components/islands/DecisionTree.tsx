/**
 * 醫療決策樹島嶼組件
 * 使用 React Flow 提供互動式臨床決策支援
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Node,
  Edge,
  Connection,
  BackgroundVariant,
  Position,
  Handle
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import type { DecisionTree } from '../../content/config';
import type { SupportedLocale } from '../../env.d';
import { t } from '../../utils/i18n';

interface Props {
  decisionTree: DecisionTree;
  locale: SupportedLocale;
  className?: string;
}

interface DecisionState {
  currentNodeId: string;
  answers: Record<string, any>;
  path: string[];
  isComplete: boolean;
  result: any;
}

// 自定義節點組件
const QuestionNode = ({ data, selected }: { data: any; selected: boolean }) => {
  const { label, question, options, onAnswer, currentAnswer, locale } = data;
  
  return (
    <div className={`
      bg-white rounded-lg border-2 p-4 shadow-lg min-w-[280px] max-w-[400px]
      ${selected ? 'border-medical-primary-500' : 'border-medical-neutral-300'}
    `}>
      <Handle type="target" position={Position.Top} />
      
      <div className="space-y-3">
        <h3 className="font-semibold text-medical-neutral-900 text-sm">
          {label[locale] || label['zh-TW']}
        </h3>
        
        {question && (
          <p className="text-medical-neutral-700 text-sm">
            {question[locale] || question['zh-TW']}
          </p>
        )}
        
        {options && (
          <div className="space-y-2">
            {options.map((option: any) => (
              <button
                key={option.id}
                onClick={() => onAnswer(option.value, option.nextNodeId)}
                className={`
                  w-full text-left px-3 py-2 rounded-md text-sm transition-colors
                  ${currentAnswer === option.value
                    ? 'bg-medical-primary-100 border-medical-primary-300 text-medical-primary-800'
                    : 'bg-medical-neutral-50 border-medical-neutral-200 text-medical-neutral-700 hover:bg-medical-neutral-100'
                  } border
                `}
              >
                {option.label[locale] || option.label['zh-TW']}
              </button>
            ))}
          </div>
        )}
      </div>
      
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
};

const ResultNode = ({ data, selected }: { data: any; selected: boolean }) => {
  const { label, result, locale } = data;
  
  const getRiskColor = (severity: string) => {
    const colors = {
      'low': 'bg-green-100 border-green-300 text-green-800',
      'moderate': 'bg-yellow-100 border-yellow-300 text-yellow-800',
      'high': 'bg-orange-100 border-orange-300 text-orange-800',
      'critical': 'bg-red-100 border-red-300 text-red-800'
    };
    return colors[severity as keyof typeof colors] || colors.moderate;
  };
  
  return (
    <div className={`
      rounded-lg border-2 p-4 shadow-lg min-w-[300px] max-w-[450px]
      ${selected ? 'border-medical-primary-500' : 'border-medical-neutral-300'}
      ${result?.severity ? getRiskColor(result.severity) : 'bg-white'}
    `}>
      <Handle type="target" position={Position.Top} />
      
      <div className="space-y-3">
        <div className="flex items-center space-x-2">
          {result?.severity && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium">
              {result.severity === 'low' && '✓'}
              {result.severity === 'moderate' && '⚠'}
              {result.severity === 'high' && '⚠'}
              {result.severity === 'critical' && '⚠'}
            </span>
          )}
          <h3 className="font-semibold text-sm">
            {label[locale] || label['zh-TW']}
          </h3>
        </div>
        
        {result?.recommendation && (
          <div className="space-y-2">
            <h4 className="font-medium text-sm">建議：</h4>
            <p className="text-sm">
              {result.recommendation[locale] || result.recommendation['zh-TW']}
            </p>
          </div>
        )}
        
        {result?.actions && result.actions.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium text-sm">行動項目：</h4>
            <ul className="space-y-1">
              {result.actions.map((action: any, index: number) => (
                <li key={index} className="flex items-start text-sm">
                  <span className="flex-shrink-0 w-2 h-2 bg-current rounded-full mt-2 mr-2"></span>
                  {action[locale] || action['zh-TW']}
                </li>
              ))}
            </ul>
          </div>
        )}
        
        {result?.followUp && (
          <div className="space-y-2">
            <h4 className="font-medium text-sm">後續追蹤：</h4>
            <p className="text-sm">
              {result.followUp[locale] || result.followUp['zh-TW']}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

const StartNode = ({ data, selected }: { data: any; selected: boolean }) => {
  const { label, content, locale } = data;
  
  return (
    <div className={`
      bg-medical-primary-50 rounded-lg border-2 p-4 shadow-lg min-w-[250px]
      ${selected ? 'border-medical-primary-500' : 'border-medical-primary-300'}
    `}>
      <div className="space-y-2">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-medical-primary-600 rounded-full"></div>
          <h3 className="font-semibold text-medical-primary-900 text-sm">
            {label[locale] || label['zh-TW']}
          </h3>
        </div>
        
        {content && (
          <p className="text-medical-primary-700 text-sm">
            {content[locale] || content['zh-TW']}
          </p>
        )}
      </div>
      
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
};

// 節點類型映射
const nodeTypes = {
  start: StartNode,
  question: QuestionNode,
  result: ResultNode,
  action: ResultNode // 使用相同的組件
};

export default function DecisionTreeComponent({ 
  decisionTree, 
  locale, 
  className = '' 
}: Props) {
  const [state, setState] = useState<DecisionState>({
    currentNodeId: '',
    answers: {},
    path: [],
    isComplete: false,
    result: null
  });

  const [startTime, setStartTime] = useState<number>(Date.now());

  // 處理用戶回答
  const handleAnswer = useCallback((answer: any, nextNodeId?: string) => {
    setState(prev => {
      const newAnswers = { ...prev.answers, [prev.currentNodeId]: answer };
      const newPath = [...prev.path, prev.currentNodeId];
      
      // 如果有指定下一個節點，使用它；否則根據邏輯查找
      let nextNode = nextNodeId;
      if (!nextNode) {
        // 查找匹配的邊
        const matchingEdge = decisionTree.edges.find(edge => 
          edge.source === prev.currentNodeId &&
          (!edge.condition || edge.condition.value === answer)
        );
        nextNode = matchingEdge?.target;
      }
      
      if (!nextNode) {
        console.warn('No next node found for answer:', answer);
        return prev;
      }
      
      const targetNode = decisionTree.nodes.find(n => n.id === nextNode);
      const isComplete = targetNode?.type === 'result' || targetNode?.type === 'action';
      
      return {
        currentNodeId: nextNode,
        answers: newAnswers,
        path: newPath,
        isComplete,
        result: isComplete ? targetNode?.data.result : null
      };
    });
  }, [decisionTree]);

  // 重設決策樹
  const handleReset = useCallback(() => {
    const startNode = decisionTree.nodes.find(node => node.type === 'start');
    setState({
      currentNodeId: startNode?.id || '',
      answers: {},
      path: [],
      isComplete: false,
      result: null
    });
    setStartTime(Date.now());
  }, [decisionTree]);

  // 初始化
  useEffect(() => {
    handleReset();
  }, [handleReset]);

  // 準備 React Flow 的節點和邊
  const { nodes, edges } = useMemo(() => {
    const flowNodes: Node[] = decisionTree.nodes.map(node => ({
      id: node.id,
      type: node.type,
      position: node.position,
      data: {
        ...node.data,
        locale,
        onAnswer: handleAnswer,
        currentAnswer: state.answers[node.id],
        isActive: node.id === state.currentNodeId
      },
      style: {
        opacity: state.path.includes(node.id) || node.id === state.currentNodeId || node.type === 'start' ? 1 : 0.6,
        ...node.data.style
      }
    }));

    const flowEdges: Edge[] = decisionTree.edges.map(edge => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      label: edge.label?.[locale] || edge.label?.['zh-TW'],
      style: {
        opacity: state.path.some(nodeId => 
          nodeId === edge.source && 
          decisionTree.edges.some(e => e.source === nodeId && e.target === edge.target)
        ) ? 1 : 0.3,
        ...edge.style
      },
      animated: state.path.some(nodeId => nodeId === edge.source)
    }));

    return { nodes: flowNodes, edges: flowEdges };
  }, [decisionTree, locale, handleAnswer, state]);

  const [flowNodes, setNodes, onNodesChange] = useNodesState(nodes);
  const [flowEdges, setEdges, onEdgesChange] = useEdgesState(edges);

  // 更新節點和邊當狀態改變時
  useEffect(() => {
    setNodes(nodes);
    setEdges(edges);
  }, [nodes, edges, setNodes, setEdges]);

  // 觸發分析事件
  useEffect(() => {
    if (state.isComplete && typeof window !== 'undefined') {
      const completionTime = Date.now() - startTime;
      
      window.dispatchEvent(new CustomEvent('decisionTree:completed', {
        detail: {
          treeId: decisionTree.id,
          answers: state.answers,
          path: state.path,
          result: state.result,
          completionTime
        }
      }));
    }
  }, [state.isComplete, decisionTree.id, state.answers, state.path, state.result, startTime]);

  return (
    <div className={`decision-tree-component ${className}`}>
      {/* 標題和說明 */}
      <div className="mb-6">
        <h2 className="text-xl font-bold text-medical-neutral-900 mb-2">
          {decisionTree.title[locale] || decisionTree.title['zh-TW']}
        </h2>
        
        {decisionTree.description && (
          <p className="text-medical-neutral-600">
            {decisionTree.description[locale] || decisionTree.description['zh-TW']}
          </p>
        )}
        
        {decisionTree.usageInstructions && (
          <div className="mt-3 p-3 bg-medical-primary-50 rounded-lg">
            <p className="text-sm text-medical-primary-700">
              <strong>使用說明：</strong>
              {decisionTree.usageInstructions[locale] || decisionTree.usageInstructions['zh-TW']}
            </p>
          </div>
        )}
      </div>

      {/* 進度指示器 */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <span className="text-sm text-medical-neutral-600">
            步驟 {state.path.length + 1}
          </span>
          
          {state.isComplete && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
              ✓ 完成
            </span>
          )}
        </div>
        
        <button
          onClick={handleReset}
          className="px-3 py-1 text-sm border border-medical-neutral-300 rounded-md text-medical-neutral-700 hover:bg-medical-neutral-50 transition-colors"
        >
          重新開始
        </button>
      </div>

      {/* React Flow 決策樹 */}
      <div className="h-[600px] border border-medical-neutral-200 rounded-lg overflow-hidden">
        <ReactFlow
          nodes={flowNodes}
          edges={flowEdges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{ padding: 0.2 }}
          minZoom={0.5}
          maxZoom={2}
          defaultViewport={{ x: 0, y: 0, zoom: 1 }}
        >
          <Controls />
          <MiniMap 
            nodeColor={(node) => {
              if (node.type === 'start') return '#3B82F6';
              if (node.type === 'question') return '#6B7280';
              if (node.type === 'result') return '#10B981';
              return '#9CA3AF';
            }}
            maskColor="rgb(240, 242, 247, 0.7)"
          />
          <Background variant={BackgroundVariant.Dots} gap={20} size={1} />
        </ReactFlow>
      </div>

      {/* 完成結果摘要 */}
      {state.isComplete && state.result && (
        <div className="mt-6 p-4 bg-medical-neutral-50 rounded-lg">
          <h3 className="font-semibold text-medical-neutral-900 mb-3">決策摘要</h3>
          
          <div className="space-y-3">
            <div>
              <span className="text-sm font-medium text-medical-neutral-600">決策路徑：</span>
              <div className="mt-1 flex flex-wrap gap-2">
                {state.path.map((nodeId, index) => {
                  const node = decisionTree.nodes.find(n => n.id === nodeId);
                  return (
                    <span key={nodeId} className="inline-flex items-center px-2 py-1 rounded-md bg-medical-primary-100 text-medical-primary-800 text-xs">
                      {index + 1}. {node?.data.label[locale] || node?.data.label['zh-TW']}
                    </span>
                  );
                })}
              </div>
            </div>
            
            <div>
              <span className="text-sm font-medium text-medical-neutral-600">完成時間：</span>
              <span className="ml-2 text-sm text-medical-neutral-700">
                {Math.round((Date.now() - startTime) / 1000)} 秒
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 參考資料 */}
      {decisionTree.references && decisionTree.references.length > 0 && (
        <div className="mt-6 p-4 bg-white border border-medical-neutral-200 rounded-lg">
          <h4 className="font-medium text-medical-neutral-900 mb-3">參考資料</h4>
          <ul className="space-y-1 text-sm">
            {decisionTree.references.map((ref, index) => (
              <li key={index} className="text-medical-neutral-600">
                {index + 1}. {ref.title}
                {ref.authors && ` - ${ref.authors.join(', ')}`}
                {ref.year && ` (${ref.year})`}
                {ref.url && (
                  <a 
                    href={ref.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="ml-2 text-medical-primary-600 hover:text-medical-primary-700"
                  >
                    [連結]
                  </a>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* 無障礙文字替代 */}
      <div className="sr-only">
        <h3>{decisionTree.accessibility.ariaLabel[locale] || decisionTree.accessibility.ariaLabel['zh-TW']}</h3>
        <p>{decisionTree.accessibility.textAlternative[locale] || decisionTree.accessibility.textAlternative['zh-TW']}</p>
      </div>
    </div>
  );
}