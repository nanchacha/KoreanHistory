import { NextRequest, NextResponse } from "next/server";
import { VertexAI } from "@google-cloud/vertexai";
import pdfParse from "pdf-parse";

// Setup Vertex AI (Using credentials loaded from GOOGLE_APPLICATION_CREDENTIALS)
const project = "koreanhistory-502203";
const location = "us-central1"; // Commonly used region for Gemini in Vertex AI
const vertexAI = new VertexAI({ project, location });

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // 1. Parse PDF text
    const buffer = Buffer.from(await file.arrayBuffer());
    const pdfData = await pdfParse(buffer);
    const text = pdfData.text;
    
    // For MVP and token limits, limit text to first 6000 characters
    const limitedText = text.substring(0, 6000);

    // 2. Call Gemini API via Vertex AI
    const generativeModel = vertexAI.preview.getGenerativeModel({
      model: "gemini-1.0-pro-001", // The most stable base model in Vertex AI
      generationConfig: {
        maxOutputTokens: 8192,
        temperature: 0.1, // Low temperature for consistent JSON
      },
    });

    const prompt = `
당신은 한국사 전문가이자 데이터 구조화 엔지니어입니다.
다음은 한국사능력검정시험 기출문제 파일에서 추출한 텍스트입니다.
이 텍스트를 분석하여, JSON 배열 형태로 파싱해 주세요. 
반드시 유효한 JSON 배열 문자열로만 응답해 주세요. (마크다운 \`\`\`json 등의 포맷팅 기호를 절대 포함하지 마세요)

[JSON 스키마]
[
  {
    "question": "문제 내용 전체 텍스트",
    "options": ["보기 1 내용", "보기 2 내용", "보기 3 내용", "보기 4 내용", "보기 5 내용"],
    "answer": 0, // 정답 인덱스 (0부터 시작, 모르면 0)
    "explanation": "이 문제에 대한 간단한 역사적 해설",
    "nodes": ["관련된 역사적 사건 이름", "관련 인물", "장소"] // 배열 형태
  }
]

[PDF 텍스트]
${limitedText}
`;

    const request = {
      contents: [{ role: "user", parts: [{ text: prompt }] }],
    };

    let resultText = "[]";
    try {
      const response = await generativeModel.generateContent(request);
      resultText = response.response.candidates?.[0]?.content?.parts?.[0]?.text || "[]";
    } catch (apiError) {
      console.warn("Gemini API call failed, falling back to mock data:", apiError);
      
      // Fallback to Mock Data so the user's flow isn't blocked by GCP quotas/models
      const mockData = [
        {
          "question": "[가상 데이터] 다음 중 고려 시대의 사건으로 옳지 않은 것은?",
          "options": ["강동 6주 획득", "별무반 창설", "대마도 정벌", "귀주 대첩", "삼별초의 항쟁"],
          "answer": 2,
          "explanation": "대마도 정벌은 조선 세종 때 이종무가 수행한 사건입니다. (API 연동 실패로 임시 데이터를 보여주고 있습니다)",
          "nodes": ["대마도 정벌", "이종무", "조선 세종"]
        },
        {
          "question": "[가상 데이터] 임진왜란 당시 한산도 대첩을 이끈 인물은?",
          "options": ["권율", "이순신", "원균", "곽재우", "김시민"],
          "answer": 1,
          "explanation": "한산도 대첩은 이순신 장군이 학익진 전술을 사용하여 왜군을 크게 무찌른 전투입니다. (임시 데이터)",
          "nodes": ["한산도 대첩", "이순신", "임진왜란"]
        }
      ];
      return NextResponse.json({ success: true, data: mockData, isMock: true });
    }
    
    // Clean markdown if the model hallucinates it despite instructions
    const cleanJson = resultText.replace(/```json/gi, '').replace(/```/g, '').trim();
    
    let parsedData = [];
    try {
      parsedData = JSON.parse(cleanJson);
    } catch (parseError) {
      console.error("Failed to parse Gemini output as JSON:", cleanJson);
      throw new Error("Gemini API가 유효한 JSON을 반환하지 않았습니다.");
    }

    return NextResponse.json({ success: true, data: parsedData });
  } catch (error: any) {
    console.error("PDF Parsing Error:", error);
    return NextResponse.json({ error: error.message || "Failed to process PDF" }, { status: 500 });
  }
}
