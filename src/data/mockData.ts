export type NodeGroup = 'event' | 'person' | 'place';

export interface GraphNode {
  id: string;
  label: string;
  group: NodeGroup;
  properties: {
    year?: number;
    summary?: string;
    description?: string;
    location?: string;
  };
  x?: number;
  y?: number;
  fx?: number;
  fy?: number;
}

export interface GraphLink {
  source: string;
  target: string;
  label: string;
}

export interface QuizData {
  id: string;
  question: string;
  options: string[];
  answer: number;
  explanation: string;
  relatedNodeIds: string[];
  sourcePdf?: string;
}

export const rawData = {
  nodes: [
    { id: "event_1", label: "을미사변", group: "event" as NodeGroup, properties: { year: 1895, summary: "명성황후가 경복궁에서 일본 낭인들에게 시해된 사건" } },
    { id: "person_1", label: "명성황후", group: "person" as NodeGroup, properties: { description: "조선 제26대 왕 고종의 왕비" } },
    { id: "person_2", label: "미우라 고로", group: "person" as NodeGroup, properties: { description: "당시 일본 공사, 사건의 주동자" } },
    { id: "place_1", label: "경복궁 건청궁", group: "place" as NodeGroup, properties: { location: "한성부 (현재 서울)" } },
    { id: "event_2", label: "을미개혁\n(단발령)", group: "event" as NodeGroup, properties: { year: 1895, summary: "을미사변 이후 성립된 친일 내각이 추진한 개혁" } },
    { id: "event_3", label: "을미의병", group: "event" as NodeGroup, properties: { year: 1895, summary: "을미사변과 단발령에 반발하여 일어난 항일 의병" } },
    { id: "person_3", label: "유인석", group: "person" as NodeGroup, properties: { description: "을미의병의 대표적인 의병장" } },
    { id: "person_4", label: "고종", group: "person" as NodeGroup, properties: { description: "조선의 제26대 왕, 아관파천 단행" } },
    { id: "event_4", label: "아관파천", group: "event" as NodeGroup, properties: { year: 1896, summary: "고종이 신변의 위협을 느껴 러시아 공사관으로 거처를 옮긴 사건" } }
  ] as GraphNode[],
  edges: [
    { source: "event_1", target: "place_1", label: "발생 장소" },
    { source: "person_2", target: "event_1", label: "주동" },
    { source: "person_1", target: "event_1", label: "피해" },
    { source: "person_4", target: "event_1", label: "관련 (배우자)" },
    { source: "event_1", target: "event_2", label: "원인 제공" },
    { source: "event_1", target: "event_3", label: "원인 제공 (국모 시해)" },
    { source: "event_2", target: "event_3", label: "원인 제공 (단발령)" },
    { source: "person_3", target: "event_3", label: "주도 (의병장)" },
    { source: "event_1", target: "event_4", label: "원인 제공 (신변 위협)" },
    { source: "person_4", target: "event_4", label: "단행" }
  ] as GraphLink[]
};

export const sampleQuiz: QuizData = {
  id: "quiz_1",
  question: "다음 사건(을미사변)을 계기로 일어난 사실로 옳은 것은?",
  options: [
    "진주에서 임술농민봉기가 발생했다.",
    "단발령이 시행되고 을미의병이 일어났다.",
    "러시아의 간섭을 피하기 위해 아관파천을 단행했다."
  ],
  answer: 1, // 0-indexed, so 1 is option 2
  explanation: "을미사변 이후 단발령 등 을미개혁이 추진되었으며, 이에 반발하여 위정척사 사상을 가진 유생층을 중심으로 을미의병이 일어났습니다.",
  relatedNodeIds: ["event_1", "event_2", "event_3"]
};
