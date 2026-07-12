"use client";

import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { rawData, sampleQuiz, GraphNode, GraphLink, QuizData, NodeGroup } from "../data/mockData";
import { Info, MapPin, User, Bookmark, CheckCircle2, XCircle, X, ChevronRight, Share2 } from "lucide-react";
import { supabase } from "../lib/supabase";

// Dynamically import the ForceGraph component to avoid SSR issues with Canvas
const HistoryGraph = dynamic(() => import("../components/HistoryGraph"), { ssr: false });
import MiniMap from "../components/MiniMap";

export default function Home() {
  const [showPerson, setShowPerson] = useState(true);
  const [showPlace, setShowPlace] = useState(true);
  const [showExamTopics, setShowExamTopics] = useState(false);
  const [selectedExamYear, setSelectedExamYear] = useState<string>("all");
  
  // Data State
  const [nodes, setNodes] = useState<GraphNode[]>([]);
  const [edges, setEdges] = useState<GraphLink[]>([]);
  const [quizzes, setQuizzes] = useState<QuizData[]>([]);

  // Quiz UI State
  const [activeTab, setActiveTab] = useState<'graph' | 'quiz'>('graph');
  const [currentQuizIdx, setCurrentQuizIdx] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [isAnswerChecked, setIsAnswerChecked] = useState(false);
  
  const [highlightNodes, setHighlightNodes] = useState<Set<string>>(new Set());

  // Modal State
  const [selectedItem, setSelectedItem] = useState<{ type: 'node' | 'link', data: GraphNode | GraphLink } | null>(null);
  const [modalPos, setModalPos] = useState<{ x: number, y: number } | null>(null);
  const [activeLocation, setActiveLocation] = useState<string | null>(null);

  const availableYears = React.useMemo(() => {
    const years = new Set<string>();
    quizzes.forEach(q => {
      const match = q.sourcePdf?.match(/(\d{4})/);
      if (match) {
        years.add(match[1]);
      }
    });
    return Array.from(years).sort((a, b) => b.localeCompare(a));
  }, [quizzes]);

  const examNodeIds = React.useMemo(() => {
    const ids = new Set<string>();
    quizzes.forEach(q => {
      const match = q.sourcePdf?.match(/(\d{4})/);
      const quizYear = match ? match[1] : 'unknown';
      
      if (selectedExamYear === "all" || selectedExamYear === quizYear) {
        q.relatedNodeIds?.forEach(id => ids.add(id));
      }
    });
    return ids;
  }, [quizzes, selectedExamYear]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [quizRes, nodeRes, edgeRes] = await Promise.all([
          supabase.from('quizzes').select('*'),
          supabase.from('nodes').select('*'),
          supabase.from('edges').select('*')
        ]);

        if (quizRes.data && quizRes.data.length > 0) {
          setQuizzes(quizRes.data.map(q => ({
            id: q.id,
            question: q.question,
            options: q.options,
            answer: q.answer,
            explanation: q.explanation,
            relatedNodeIds: q.related_node_ids || [],
            sourcePdf: q.source_pdf || '',
          })));
        }

        if (nodeRes.data && nodeRes.data.length > 0) {
          const validNodes = nodeRes.data.filter(n => !n.label.includes('test'));
          setNodes(validNodes.map(n => ({
            id: n.id,
            label: n.label,
            group: n.group as NodeGroup,
            properties: n.properties || {}
          })));
        }

        if (edgeRes.data && edgeRes.data.length > 0) {
          const validEdges = edgeRes.data.filter(e => e.source_id && e.target_id && !(e.label || '').includes('test'));
          setEdges(validEdges.map(e => ({
            source: e.source_id,
            target: e.target_id,
            label: e.label || ''
          })));
        }
      } catch (err) {
        console.error("Failed to fetch data:", err);
      }
    };
    fetchData();
  }, []);

  const displayQuizzes = quizzes.length > 0 ? quizzes : [sampleQuiz];
  const displayNodes = nodes.length > 0 ? nodes : rawData.nodes;
  const displayEdges = edges.length > 0 ? edges : rawData.edges;

  const currentQuiz = displayQuizzes[currentQuizIdx] || sampleQuiz;

  const handleNodeClick = (node: GraphNode, event: MouseEvent) => {
    setSelectedItem({ type: 'node', data: node });
    setModalPos({ x: event.clientX, y: event.clientY });

    if (node.group === 'place') {
      setActiveLocation(node.label);
    } else if (node.properties?.location) {
      setActiveLocation(node.properties.location);
    } else {
      setActiveLocation(null);
    }
  };

  const handleLinkClick = (link: GraphLink, event: MouseEvent) => {
    setSelectedItem({ type: 'link', data: link });
    setModalPos({ x: event.clientX, y: event.clientY });
  };

  const closeModal = () => {
    setSelectedItem(null);
    setModalPos(null);
    setActiveLocation(null);
  };

  const handleCheckAnswer = () => {
    if (selectedAnswer === null) return;
    setIsAnswerChecked(true);
    
    if (selectedAnswer === currentQuiz.answer) {
      setHighlightNodes(new Set(currentQuiz.relatedNodeIds));
    } else {
      setHighlightNodes(new Set());
    }
  };

  const handleNextQuiz = () => {
    setCurrentQuizIdx((prev) => (prev + 1) % displayQuizzes.length);
    setSelectedAnswer(null);
    setIsAnswerChecked(false);
    setHighlightNodes(new Set());
  };

  const getSourceLabel = (link: any) => typeof link.source === 'object' ? link.source.label : (displayNodes.find(n => n.id === link.source)?.label || link.source);
  const getTargetLabel = (link: any) => typeof link.target === 'object' ? link.target.label : (displayNodes.find(n => n.id === link.target)?.label || link.target);

  return (
    <div className="flex flex-col h-screen bg-gray-50 text-gray-900 font-sans overflow-hidden relative">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-200 px-3 py-2 md:px-6 md:py-4 flex-shrink-0 shadow-sm z-10 flex justify-between items-center gap-2">
        <div className="flex-1 min-w-0">
          <h1 className="text-base md:text-2xl font-bold text-gray-900 flex items-center gap-1.5 md:gap-2 truncate">
            <Share2 className="text-blue-600 flex-shrink-0 w-5 h-5 md:w-6 md:h-6" /> 
            <span className="truncate">유기적으로 연결되는 한국사</span>
          </h1>
          <p className="text-[10px] md:text-sm text-gray-500 mt-0.5 md:mt-1 truncate">
            사건, 인물, 장소의 관계를 시각적으로 이해하는 인터랙티브 학습 플랫폼
          </p>
        </div>
        <a href="/admin" target="_blank" className="text-[11px] md:text-sm font-medium text-blue-600 hover:text-blue-800 bg-blue-50 px-2.5 py-1.5 md:px-4 md:py-2 rounded-lg transition-colors border border-blue-100 whitespace-nowrap flex-shrink-0">
          관리자<span className="hidden md:inline"> (Admin) 페이지 열기</span>
        </a>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden relative">
        
        {/* Full Screen Interactive Graph */}
        <section className="w-full h-full relative bg-white">
          <HistoryGraph 
            nodes={displayNodes} 
            links={displayEdges} 
            onNodeClick={handleNodeClick}
            onLinkClick={handleLinkClick}
            highlightNodes={highlightNodes}
            showPerson={showPerson}
            showPlace={showPlace}
            showExamTopics={showExamTopics}
            examNodeIds={examNodeIds}
          />

          {/* Top Left Floating Panel (Tabs + Content) */}
          <div className="absolute top-3 left-3 md:top-4 md:left-4 z-10 flex flex-col gap-2 md:gap-3 w-[calc(100vw-1.5rem)] max-w-[280px] md:w-80 md:max-w-none pointer-events-none">
            
            {/* Tabs */}
            <div className="flex bg-white/90 backdrop-blur-md rounded-xl p-1 md:p-1.5 shadow-md border border-gray-200 pointer-events-auto">
              <button 
                onClick={() => setActiveTab('graph')}
                className={`flex-1 py-1.5 md:py-2 text-xs md:text-sm font-bold rounded-lg transition-all ${
                  activeTab === 'graph' 
                    ? 'bg-white shadow-sm text-blue-600' 
                    : 'text-gray-500 hover:bg-gray-50'
                }`}
              >
                노드 시각화
              </button>
              <button 
                onClick={() => setActiveTab('quiz')}
                className={`flex-1 py-1.5 md:py-2 text-xs md:text-sm font-bold rounded-lg transition-all ${
                  activeTab === 'quiz' 
                    ? 'bg-white shadow-sm text-blue-600' 
                    : 'text-gray-500 hover:bg-gray-50'
                }`}
              >
                기출문제 풀이
              </button>
            </div>

            {/* Tab Content */}
            {activeTab === 'graph' && (
              <div className="bg-white/95 backdrop-blur-md border border-gray-200 rounded-xl md:rounded-2xl p-3.5 md:p-5 shadow-lg pointer-events-auto animate-in slide-in-from-top-2 fade-in duration-200">
                <h2 className="text-xs md:text-sm font-bold text-gray-800 mb-3 md:mb-4 border-b pb-2 flex items-center gap-2">
                  <Bookmark size={16} className="text-gray-500 md:w-4 md:h-4 w-3.5 h-3.5"/> 노드 시각화 필터
                </h2>
                <div className="space-y-3">
                  <div className="flex flex-col gap-2 p-2 rounded-lg border border-purple-100 bg-purple-50/50">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={showExamTopics} 
                        onChange={(e) => setShowExamTopics(e.target.checked)}
                        className="w-4 h-4 text-purple-600 rounded border-gray-300 focus:ring-purple-500"
                      />
                      <span className="text-xs md:text-sm font-bold text-purple-800 flex items-center gap-2">
                        <Bookmark size={14} className="text-purple-600 w-3.5 h-3.5 md:w-3.5 md:h-3.5"/> 기출문제 영역만 보기
                      </span>
                    </label>
                    
                    {showExamTopics && availableYears.length > 0 && (
                      <div className="ml-6 md:ml-7 flex items-center gap-2 animate-in slide-in-from-top-1 fade-in">
                        <span className="text-[10px] md:text-[11px] text-purple-700 font-medium">연도 필터:</span>
                        <select 
                          value={selectedExamYear}
                          onChange={(e) => setSelectedExamYear(e.target.value)}
                          className="text-[10px] md:text-[11px] bg-white border border-purple-200 text-purple-900 rounded px-1 md:px-1.5 py-0.5 md:py-1 outline-none focus:border-purple-400 font-medium cursor-pointer"
                        >
                          <option value="all">전체 년도</option>
                          {availableYears.map(year => (
                            <option key={year} value={year}>{year}년</option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                  
                  <div className="h-px bg-gray-100 my-2 md:my-3"></div>
                  
                  <label className="flex items-center gap-2 md:gap-3 cursor-pointer p-1.5 md:p-2 rounded-lg hover:bg-gray-50 transition-colors">
                    <input 
                      type="checkbox" 
                      checked={showPerson} 
                      onChange={(e) => setShowPerson(e.target.checked)}
                      className="w-3.5 h-3.5 md:w-4 md:h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                    />
                    <span className="text-xs md:text-sm font-medium text-gray-700 flex items-center gap-2">
                      <User className="text-[#4D96FF] w-3.5 h-3.5 md:w-4 md:h-4"/> 인물 노드 강조
                    </span>
                  </label>
                  <label className="flex items-center gap-2 md:gap-3 cursor-pointer p-1.5 md:p-2 rounded-lg hover:bg-gray-50 transition-colors">
                    <input 
                      type="checkbox" 
                      checked={showPlace} 
                      onChange={(e) => setShowPlace(e.target.checked)}
                      className="w-3.5 h-3.5 md:w-4 md:h-4 text-green-600 rounded border-gray-300 focus:ring-green-500"
                    />
                    <span className="text-xs md:text-sm font-medium text-gray-700 flex items-center gap-2">
                      <MapPin className="text-[#6BCB77] w-3.5 h-3.5 md:w-4 md:h-4"/> 장소 노드 강조
                    </span>
                  </label>
                </div>
              </div>
            )}

            {activeTab === 'quiz' && (
              <div className="bg-white/95 backdrop-blur-md border border-gray-200 rounded-xl md:rounded-2xl p-3.5 md:p-5 shadow-lg flex flex-col pointer-events-auto animate-in slide-in-from-top-2 fade-in duration-200 max-h-[60vh] md:max-h-[70vh] overflow-y-auto custom-scrollbar">
                <h2 className="text-xs md:text-sm font-bold text-gray-800 mb-3 md:mb-4 border-b pb-2 flex justify-between items-center">
                  📝 AI 추출 기출문제
                  <span className="text-[9px] md:text-[10px] bg-green-100 text-green-700 px-1.5 md:px-2 py-0.5 rounded font-bold shadow-sm border border-green-200">
                    DB 실시간 연동
                  </span>
                </h2>
                <div className="mb-4 md:mb-5 flex-1">
                  <div className="flex justify-between items-center mb-2 md:mb-3">
                    <p className="text-xs md:text-sm font-bold text-gray-800 leading-relaxed">
                      Q. {currentQuiz.question}
                    </p>
                  </div>
                  <div className="space-y-1.5 md:space-y-2 text-xs md:text-sm text-gray-700">
                    {currentQuiz.options.map((option, idx) => (
                      <label 
                        key={idx}
                        className={`flex items-start gap-3 cursor-pointer p-3 rounded-lg border transition-all
                          ${selectedAnswer === idx 
                            ? 'border-blue-500 bg-blue-50 shadow-sm' 
                            : 'border-transparent hover:bg-gray-50 hover:border-gray-200'}`}
                      >
                        <input 
                          type="radio" 
                          name="quiz" 
                          value={idx}
                          checked={selectedAnswer === idx}
                          onChange={() => {
                            setSelectedAnswer(idx);
                            setIsAnswerChecked(false);
                          }}
                          className="mt-0.5 w-4 h-4 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="flex-1 text-xs leading-relaxed">{idx + 1}. {option}</span>
                      </label>
                    ))}
                  </div>
                </div>
                
                <div className="flex gap-2 mt-auto">
                  <button 
                    onClick={handleCheckAnswer}
                    disabled={selectedAnswer === null}
                    className={`flex-1 font-medium text-xs md:text-sm py-1.5 md:py-2 px-3 md:px-4 rounded-lg md:rounded-xl transition-all shadow-sm ${
                      selectedAnswer === null 
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-gray-900 hover:bg-gray-800 text-white hover:shadow-md active:scale-[0.98]'
                    }`}
                  >
                    정답 확인하기
                  </button>

                  {displayQuizzes.length > 1 && (
                    <button 
                      onClick={handleNextQuiz}
                      className="bg-blue-50 text-blue-600 hover:bg-blue-100 py-1.5 md:py-2 px-2.5 md:px-3 rounded-lg md:rounded-xl transition-colors font-medium flex items-center justify-center border border-blue-100"
                      title="다음 문제"
                    >
                      <ChevronRight className="w-4 h-4 md:w-[18px] md:h-[18px]" />
                    </button>
                  )}
                </div>

                {/* Quiz Feedback */}
                {isAnswerChecked && (
                  <div className={`mt-3 md:mt-4 text-xs md:text-sm p-3 md:p-4 rounded-lg md:rounded-xl shadow-inner border flex items-start gap-2 md:gap-3 animate-in fade-in slide-in-from-top-2 ${
                    selectedAnswer === currentQuiz.answer 
                      ? 'bg-green-50 border-green-200 text-green-800'
                      : 'bg-red-50 border-red-200 text-red-800'
                  }`}>
                    {selectedAnswer === currentQuiz.answer ? (
                      <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    )}
                    <div>
                      <p className="font-bold mb-1">
                        {selectedAnswer === currentQuiz.answer ? "정답입니다!" : "오답입니다."}
                      </p>
                      <p className="text-xs leading-relaxed opacity-90 mt-1.5">
                        {currentQuiz.explanation}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
          
          {/* Legend */}
          <div className="absolute bottom-4 left-3 md:bottom-6 md:left-6 bg-white/90 backdrop-blur-md text-[10px] md:text-xs px-3 md:px-4 py-2 md:py-3 rounded-lg md:rounded-xl shadow-lg border border-gray-100 flex flex-col md:flex-row md:items-center gap-1.5 md:gap-4 z-10 pointer-events-none">
            <span className="flex items-center gap-1.5 font-medium text-gray-700">
              <span className="inline-block w-2.5 h-2.5 md:w-3.5 md:h-3.5 rounded-sm bg-[#FF6B6B]"></span> 사건
            </span>
            <span className="flex items-center gap-1.5 font-medium text-gray-700">
              <span className="inline-block w-2.5 h-2.5 md:w-3.5 md:h-3.5 rounded-full bg-[#4D96FF]"></span> 인물
            </span>
            <span className="flex items-center gap-1.5 font-medium text-gray-700">
              <span className="inline-block w-2.5 h-2.5 md:w-3.5 md:h-3.5 rounded-full bg-[#6BCB77]"></span> 장소
            </span>
          </div>

          {/* MiniMap */}
          <div className="absolute bottom-4 right-3 md:bottom-6 md:right-6 z-10 pointer-events-auto scale-75 md:scale-100 origin-bottom-right">
            <MiniMap locationName={activeLocation} />
          </div>
        </section>
      </main>

      {/* Details Popup Modal positioned globally */}
      {selectedItem && modalPos && (
        <div 
          className="fixed bg-white/95 backdrop-blur-xl border border-gray-200 shadow-xl rounded-xl md:rounded-2xl p-4 md:p-6 w-[260px] md:w-80 z-[100] animate-in fade-in zoom-in-95 duration-200 pointer-events-auto"
          style={{ 
            left: Math.max(10, Math.min(modalPos.x + 15, typeof window !== 'undefined' ? window.innerWidth - (window.innerWidth < 768 ? 280 : 340) : 0)),
            top: Math.max(10, Math.min(modalPos.y + 15, typeof window !== 'undefined' ? window.innerHeight - 250 : 0))
          }}
        >
          <button 
            onClick={closeModal}
            className="absolute top-3 right-3 md:top-4 md:right-4 text-gray-400 hover:text-gray-700 transition-colors bg-gray-50 hover:bg-gray-100 p-1 md:p-1.5 rounded-full"
          >
            <X className="w-3.5 h-3.5 md:w-4 md:h-4" />
          </button>
          
          {selectedItem.type === 'node' && (
            <div className="pt-1 md:pt-2 pr-4">
              <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-1.5 md:mb-2">{(selectedItem.data as GraphNode).label}</h3>
              <p className="text-xs md:text-sm text-gray-700 leading-relaxed">
                {(selectedItem.data as GraphNode).properties.year && (
                  <strong className="text-blue-600 mr-1.5">
                    [{(selectedItem.data as GraphNode).properties.year}년]
                  </strong>
                )}
                {(selectedItem.data as GraphNode).properties.summary || (selectedItem.data as GraphNode).properties.description}
                
                {(selectedItem.data as GraphNode).properties.location && (
                  <span className="block mt-2 text-gray-500 text-xs">
                    📍 {(selectedItem.data as GraphNode).properties.location}
                  </span>
                )}
              </p>
            </div>
          )}

          {selectedItem.type === 'link' && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="px-2 py-0.5 text-[10px] font-bold rounded-full text-white bg-blue-600">
                  역사적 인과관계
                </span>
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-4 pb-3 border-b border-gray-100">
                {(selectedItem.data as GraphLink).label}
              </h3>
              <div className="flex items-center justify-between text-sm bg-gray-50 p-3 rounded-xl border border-gray-100">
                <div className="flex-1 text-center font-semibold text-blue-600">
                  {getSourceLabel(selectedItem.data as GraphLink)}
                </div>
                <div className="px-3 text-gray-400">➔</div>
                <div className="flex-1 text-center font-semibold text-red-500">
                  {getTargetLabel(selectedItem.data as GraphLink)}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
