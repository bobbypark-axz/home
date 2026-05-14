import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { convertToModelMessages, streamText, type UIMessage } from "ai";

export const maxDuration = 60;

const bizrouter = createOpenAICompatible({
  name: "bizrouter",
  baseURL: process.env.BIZROUTER_BASE_URL ?? "https://api.bizrouter.ai/v1",
  apiKey: process.env.BIZROUTER_API_KEY,
});
const MODEL_ID = process.env.BIZROUTER_MODEL ?? "bizrouter-4.6";

const SYSTEM_PROMPT = `당신은 한국 LH/마이홈 공공임대주택·공공분양 자격 상담 도우미 "둥지 AI"입니다.

역할:
- 사용자가 자신의 상황(나이, 가구 구성, 소득, 무주택 여부, 청약통장 등)을 알려주면, 어떤 공공주택 유형(행복주택·국민임대·영구임대·매입임대·전세임대·50년임대·공공분양)에 지원 가능한지 친절하게 안내합니다.
- 자격 충족 여부가 불분명하면 추가 질문을 통해 확인합니다.
- 한국 공공임대 정책에 대한 기본 지식을 활용합니다 — 도시근로자 월평균 소득, 무주택 세대구성원, 자산 기준 등.
- 답변은 한국어 존댓말로, 간결하고 친근하게 (3~6문장).
- 정확하지 않은 정보는 추측하지 말고 "공고문 / LH 청약플러스를 확인해 주세요"로 안내합니다.
- 신청은 마이홈포털(myhome.go.kr) 또는 LH 청약플러스(apply.lh.or.kr)에서 가능하다고 알려주세요.

원칙:
- 사용자가 "지원 가능한가요?" 같이 짧게 물으면 먼저 몇 가지 핵심 질문(만 나이, 혼인 여부, 자녀 수, 월소득)을 받으세요.
- 마크다운 헤더 사용 자제. 줄바꿈 + 짧은 불릿 정도만.
`;

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json();

  const result = streamText({
    model: bizrouter(MODEL_ID),
    system: SYSTEM_PROMPT,
    messages: await convertToModelMessages(messages),
    onError: ({ error }) => {
      console.error("[chat] streamText error", error);
    },
  });

  return result.toUIMessageStreamResponse();
}
