const { VertexAI } = require('@google-cloud/vertexai');
const { createClient } = require('@supabase/supabase-js');
const { loadEnvConfig } = require('@next/env');
const fs = require('fs');

// Load .env.local
loadEnvConfig(process.cwd());

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials");
  process.exit(1);
}
const supabase = createClient(supabaseUrl, supabaseKey);

// Setup Vertex AI
const project = "koreanhistory-502203";
const location = "asia-northeast3";
let vertexAI;

if (process.env.GOOGLE_CREDENTIALS_JSON) {
  const credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS_JSON);
  vertexAI = new VertexAI({ project, location, googleAuthOptions: { credentials } });
} else {
  vertexAI = new VertexAI({ project, location });
}

async function seedData() {
  const topic = process.argv[2] || "임진왜란";
  console.log(`[시작] 주제 '${topic}'에 대한 지식 그래프 데이터를 AI로 생성합니다...`);

  console.log("로컬 JSON 데이터 파일(imjin_data.json)을 불러옵니다...");
  try {
    const fileContent = fs.readFileSync('./scripts/imjin_data.json', 'utf-8');
    const parsedData = JSON.parse(fileContent);
    const nodes = parsedData.nodes || [];
    const edges = parsedData.edges || [];
    
    console.log(`AI 응답 완료! 노드 ${nodes.length}개, 간선 ${edges.length}개 생성됨.`);
    console.log("Supabase DB에 적재를 시작합니다...");

    const nodeLabelToId = {};

    // 1. 노드 저장
    let nodeCount = 0;
    for (const n of nodes) {
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
        
        if (insertErr) {
          console.error(`노드 삽입 오류 (${n.label}):`, insertErr.message);
          continue;
        }
        nodeId = inserted.id;
        nodeCount++;
      }
      nodeLabelToId[n.label] = nodeId;
    }
    console.log(`새로운 노드 ${nodeCount}개 적재 완료.`);

    // 2. 간선 저장
    let edgeCount = 0;
    for (const e of edges) {
      const sourceId = nodeLabelToId[e.source_label];
      const targetId = nodeLabelToId[e.target_label];
      
      if (sourceId && targetId) {
        const { data: existingEdge } = await supabase.from('edges')
          .select('id')
          .eq('source_id', sourceId)
          .eq('target_id', targetId)
          .eq('label', e.label || '')
          .single();
          
        if (!existingEdge) {
          const { error: edgeErr } = await supabase.from('edges').insert([{
            source_id: sourceId,
            target_id: targetId,
            label: e.label || ''
          }]);
          if (edgeErr) {
            console.error(`간선 삽입 오류:`, edgeErr.message);
          } else {
            edgeCount++;
          }
        }
      } else {
        console.warn(`간선 연결 실패: ${e.source_label} -> ${e.target_label} (노드를 찾을 수 없음)`);
      }
    }
    
    console.log(`새로운 간선 ${edgeCount}개 적재 완료.`);
    console.log(`🎉 '${topic}' 지식 그래프 적재가 모두 완료되었습니다!`);
    
  } catch (err) {
    console.error("오류 발생:", err.message);
    if (err.response) {
      console.error(err.response);
    }
  }
}

seedData();
