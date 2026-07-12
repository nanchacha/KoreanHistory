"use client";

import React, { useState } from "react";
import { UploadCloud, CheckCircle, Database, AlertCircle, Loader2, Lock } from "lucide-react";
import { supabase } from "../../lib/supabase";

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");

  const [file, setFile] = useState<File | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [parsedData, setParsedData] = useState<any[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === "admin1234" || password === process.env.NEXT_PUBLIC_ADMIN_PASSWORD) {
      setIsAuthenticated(true);
    } else {
      alert("비밀번호가 일치하지 않습니다.");
      setPassword("");
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleParse = async () => {
    if (!file) return;
    setIsParsing(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/parse-pdf", {
        method: "POST",
        body: formData,
      });

      const json = await res.json();
      if (json.success) {
        setParsedData(json.data);
      } else {
        alert("파싱 실패: " + json.error);
      }
    } catch (err) {
      alert("서버 오류가 발생했습니다. 개발 서버 콘솔을 확인해주세요.");
    } finally {
      setIsParsing(false);
    }
  };

  const handleSaveToDB = async () => {
    if (parsedData.length === 0) return;
    setIsSaving(true);
    
    try {
      for (const quiz of parsedData) {
        const nodeLabelToId: Record<string, string> = {};

        // 1. 노드(Nodes) 저장 및 매핑
        for (const n of (quiz.nodes || [])) {
          if (!n.label) continue;
          
          const { data: existing } = await supabase.from('nodes').select('id').eq('label', n.label).single();
          let nodeId;
          
          if (existing) {
            nodeId = existing.id;
          } else {
            const { data: inserted, error: insertErr } = await supabase.from('nodes').insert([{
              label: n.label,
              group: n.group || 'event',
              properties: n.properties || {}
            }]).select('id').single();
            
            if (insertErr) throw insertErr;
            nodeId = inserted.id;
          }
          nodeLabelToId[n.label] = nodeId;
        }

        // 2. 간선(Edges) 저장
        for (const e of (quiz.edges || [])) {
          const sourceId = nodeLabelToId[e.source_label];
          const targetId = nodeLabelToId[e.target_label];
          
          if (sourceId && targetId) {
            // 중복 간선 방지
            const { data: existingEdge } = await supabase.from('edges')
              .select('id')
              .eq('source_id', sourceId)
              .eq('target_id', targetId)
              .eq('label', e.label || '')
              .single();
              
            if (!existingEdge) {
              await supabase.from('edges').insert([{
                source_id: sourceId,
                target_id: targetId,
                label: e.label || ''
              }]);
            }
          }
        }

        // 3. 퀴즈 저장 및 관련 노드 연결
        const relatedNodeIds = Object.values(nodeLabelToId);
        const { error: quizErr } = await supabase.from('quizzes').insert([{
          question: quiz.question,
          options: quiz.options,
          answer: quiz.answer,
          explanation: quiz.explanation,
          source_pdf: file?.name || 'unknown',
          related_node_ids: relatedNodeIds
        }]);
        
        if (quizErr) throw quizErr;
      }
      
      alert("🎉 모든 노드, 관계, 퀴즈 데이터가 성공적으로 저장되었습니다!");
      setParsedData([]);
      setFile(null);
    } catch (err: any) {
      console.error(err);
      alert("DB 저장 중 오류 발생: " + (err.message || err.toString()));
    } finally {
      setIsSaving(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 font-sans">
        <form onSubmit={handleLogin} className="bg-white p-8 rounded-3xl shadow-sm border border-gray-200 max-w-sm w-full text-center">
          <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <Lock size={32} />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">관리자 로그인</h2>
          <p className="text-gray-500 mb-8 text-sm">데이터베이스 접근 권한이 필요합니다.</p>
          
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="비밀번호 입력 (기본: admin1234)"
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4 transition-all"
            autoFocus
          />
          <button 
            type="submit" 
            className="w-full py-3 bg-gray-900 text-white rounded-xl font-medium hover:bg-gray-800 transition-all shadow-sm"
          >
            접근 권한 확인
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8 font-sans text-gray-900">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <Database className="text-blue-600" /> 한국사 데이터 관리자 (Admin)
        </h1>
        <p className="text-gray-500 mt-2">기출문제 PDF를 업로드하고 AI를 통해 JSON으로 자동 파싱합니다.</p>
      </header>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 mb-8 max-w-3xl">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <UploadCloud className="text-gray-400" /> PDF 파일 업로드
        </h2>
        
        <div className="flex items-center gap-4">
          <input 
            type="file" 
            accept="application/pdf"
            onChange={handleFileChange}
            className="block w-full text-sm text-gray-500
              file:mr-4 file:py-2.5 file:px-4
              file:rounded-xl file:border-0
              file:text-sm file:font-semibold
              file:bg-blue-50 file:text-blue-700
              hover:file:bg-blue-100 cursor-pointer border border-gray-200 rounded-xl"
          />
          <button 
            onClick={handleParse}
            disabled={!file || isParsing}
            className="whitespace-nowrap px-6 py-2.5 bg-gray-900 text-white rounded-xl font-medium hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-all"
          >
            {isParsing ? <Loader2 size={18} className="animate-spin" /> : "AI 자동 파싱 시작"}
          </button>
        </div>
      </div>

      {parsedData.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-200 flex justify-between items-center bg-gray-50/50">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <CheckCircle className="text-green-500" /> 파싱 검수 결과 ({parsedData.length}건)
            </h2>
            <button 
              onClick={handleSaveToDB}
              disabled={isSaving}
              className="px-5 py-2 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2 transition-all shadow-sm"
            >
              {isSaving ? <Loader2 size={16} className="animate-spin" /> : "Supabase에 저장하기"}
            </button>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4">No.</th>
                  <th className="px-6 py-4">문제 (Question)</th>
                  <th className="px-6 py-4">관련 노드 (Nodes)</th>
                  <th className="px-6 py-4">정답 인덱스</th>
                </tr>
              </thead>
              <tbody>
                {parsedData.map((item, idx) => (
                  <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50/50">
                    <td className="px-6 py-4 font-medium text-gray-900">{idx + 1}</td>
                    <td className="px-6 py-4 max-w-md">
                      <div className="font-medium text-gray-900 mb-1">{item.question}</div>
                      <div className="text-xs text-gray-500 truncate">{item.explanation}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {(item.nodes || []).map((n: any, i: number) => (
                          <span key={i} className="px-2 py-0.5 bg-blue-50 text-blue-700 text-xs rounded-md border border-blue-100">
                            {n.label || n}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 bg-green-100 text-green-800 font-bold rounded-lg">
                        {item.answer + 1}번
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
