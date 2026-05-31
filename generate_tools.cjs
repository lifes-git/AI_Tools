const fs = require('fs');

const tools = [
  { id: "chatgpt", category: "필수 AI", name: "ChatGPT", tier: "필수", desc: "세계에서 가장 대중적인 AI", theme: "emerald", domain: "chat.openai.com" },
  { id: "claude", category: "필수 AI", name: "Claude", tier: "필수", desc: "뛰어난 글쓰기 능력을 가진 AI", theme: "orange", domain: "claude.ai" },
  { id: "gemini", category: "필수 AI", name: "Gemini", tier: "필수", desc: "구글 멀티모달 AI", theme: "blue", domain: "gemini.google.com" },
  { id: "perplexity", category: "필수 AI", name: "Perplexity", tier: "필수", desc: "강력한 AI 검색 엔진", theme: "slate", domain: "perplexity.ai" },
  { id: "chatgpt-app", category: "필수 AI", name: "Chat GPT app", tier: "일반", desc: "모바일 챗GPT", theme: "emerald", domain: "openai.com" },
  { id: "gemini-live", category: "필수 AI", name: "Gemini live", tier: "일반", desc: "모바일 제미나이 라이브", theme: "blue", domain: "gemini.google.com" },

  // 문서/기획
  { id: "notebooklm", category: "문서/기획", name: "NotebookLM", tier: "필수", desc: "내 문서를 기반으로 리서치 및 요약", theme: "emerald", domain: "notebooklm.google.com" },
  { id: "gamma", category: "문서/기획", name: "Gamma", tier: "필수", desc: "PPT와 웹페이지 자동 생성", theme: "purple", domain: "gamma.app" },
  { id: "genspark", category: "문서/기획", name: "Genspark", tier: "심화", desc: "슬라이드 및 리서치 문서 생성", theme: "blue", domain: "genspark.ai" },
  { id: "claude-ppt", category: "문서/기획", name: "Claude in PPT", tier: "일반", desc: "PPT 내부 클로드 제어", theme: "orange", domain: "claude.ai" },
  { id: "lilys", category: "문서/기획", name: "Lilys AI", tier: "일반", desc: "유튜브, 오디오 문서 요약", theme: "blue", domain: "lilys.ai" },
  { id: "inline", category: "문서/기획", name: "inline AI", tier: "일반", desc: "공문서 작성 특화", theme: "slate", domain: "inline.ai" },
  { id: "nano-banana", category: "문서/기획", name: "Nano Banana", tier: "일반", desc: "업무 리서치 지원", theme: "orange", domain: "banana.dev" },

  // 이미지
  { id: "midjourney", category: "이미지", name: "Midjourney", tier: "필수", desc: "압도적인 퀄리티의 이미지 생성", theme: "slate", domain: "midjourney.com" },
  { id: "canva", category: "이미지", name: "Canva", tier: "필수", desc: "초보자도 쉬운 디자인 작업", theme: "blue", domain: "canva.com" },
  { id: "figma", category: "이미지", name: "Figma", tier: "심화", desc: "실시간 UI/UX 디자인 협업 툴", theme: "purple", domain: "figma.com" },
  { id: "stitch", category: "이미지", name: "Stitch", tier: "일반", desc: "디자인 운영 도구", theme: "purple", domain: "stitch.withgoogle.com" },
  { id: "claude-design", category: "이미지", name: "Claude Design", tier: "일반", desc: "대화로 디자인하는 AI 도구", theme: "orange", domain: "claude.ai" },
  { id: "whimsical", category: "이미지", name: "Whimsical", tier: "심화", desc: "마인드 매핑/시각화 도구", theme: "purple", domain: "whimsical.com" },
  { id: "mapify", category: "이미지", name: "Mapify", tier: "일반", desc: "마인드매핑 도구", theme: "blue", domain: "mapify.so" },
  { id: "flux", category: "이미지", name: "Flux", tier: "심화", desc: "최고 평가 이미지 생성", theme: "slate", domain: "blackforestlabs.ai" },
  { id: "miricanvas", category: "이미지", name: "미리캔버스", tier: "일반", desc: "카드뉴스 및 썸네일 제작", theme: "emerald", domain: "miricanvas.com" },
  { id: "bing-creator", category: "이미지", name: "Bing Creator", tier: "일반", desc: "무료 이미지 생성기", theme: "blue", domain: "bing.com" },
  { id: "ideogram", category: "이미지", name: "Ideogram", tier: "심화", desc: "타이포그래피 및 로고 특화", theme: "slate", domain: "ideogram.ai" },
  { id: "novel", category: "이미지", name: "Novel", tier: "일반", desc: "캐릭터 및 만화 생성", theme: "slate", domain: "novelai.net" },
  { id: "stable-diffusion", category: "이미지", name: "Stable Diffusion", tier: "심화", desc: "고난이도 이미지 생성", theme: "blue", domain: "stability.ai" },
  { id: "topaz", category: "이미지", name: "Topaz", tier: "일반", desc: "이미지 업스케일링 및 복구", theme: "slate", domain: "topazlabs.com" },

  // 비디오
  { id: "vrew", category: "비디오", name: "Vrew", tier: "필수", desc: "음성 인식 기반 자동 자막 영상 편집", theme: "emerald", domain: "vrew.voyagerx.com" },
  { id: "runway", category: "비디오", name: "Runway", tier: "심화", desc: "텍스트/이미지로 비디오 생성", theme: "emerald", domain: "runwayml.com" },
  { id: "sora", category: "비디오", name: "Sora", tier: "필수", desc: "오픈AI의 텍스트 투 비디오", theme: "emerald", domain: "openai.com" },
  { id: "capcut", category: "비디오", name: "CapCut", tier: "필수", desc: "무료 동영상 편집 1위", theme: "slate", domain: "capcut.com" },
  { id: "premiere", category: "비디오", name: "Premiere", tier: "심화", desc: "전문가용 비디오 편집기", theme: "purple", domain: "adobe.com" },
  { id: "flow", category: "비디오", name: "Flow", tier: "일반", desc: "아이디어 기반 숏폼 생성", theme: "blue", domain: "flow.ai" },
  { id: "seedance", category: "비디오", name: "Seedance", tier: "일반", desc: "모션 콘텐츠 제작", theme: "orange", domain: "byteplus.com" },
  { id: "kling", category: "비디오", name: "Kling", tier: "심화", desc: "자연스러운 움직임 비디오 생성", theme: "orange", domain: "kling.kuaishou.com" },
  { id: "luma", category: "비디오", name: "Luma", tier: "일반", desc: "공간 변환 시네마틱 AI", theme: "blue", domain: "lumalabs.ai" },
  { id: "veo", category: "비디오", name: "Veo 2,3", tier: "일반", desc: "효과음 동시 생성 비디오", theme: "orange", domain: "deepmind.google" },
  { id: "heygen", category: "비디오", name: "Heygen", tier: "심화", desc: "AI 아바타 비디오 생성", theme: "purple", domain: "heygen.com" },
  { id: "synthesia", category: "비디오", name: "Synthesia", tier: "일반", desc: "기업 교육용 AI 아바타", theme: "blue", domain: "synthesia.io" },
  { id: "studio-did", category: "비디오", name: "Studio D-ID", tier: "일반", desc: "사진으로 아바타 비디오 생성", theme: "slate", domain: "d-id.com" },

  // 오디오
  { id: "typecast", category: "오디오", name: "Typecast", tier: "필수", desc: "한국 대표 AI 음성 더빙", theme: "indigo", domain: "typecast.ai" },
  { id: "suno", category: "오디오", name: "Suno AI", tier: "필수", desc: "프롬프트로 고품질 음악 생성", theme: "orange", domain: "suno.com" },
  { id: "perso", category: "오디오", name: "Perso AI", tier: "일반", desc: "외국어 번역 및 더빙", theme: "blue", domain: "perso.ai" },
  { id: "elevenlabs", category: "오디오", name: "11labs", tier: "심화", desc: "글로벌 1위 AI 음성 더빙", theme: "orange", domain: "elevenlabs.io" },
  { id: "clovadubbing", category: "오디오", name: "클로바더빙", tier: "일반", desc: "네이버 AI 음성 더빙", theme: "emerald", domain: "clovadubbing.naver.com" },
  { id: "voxbox", category: "오디오", name: "VoxBox", tier: "일반", desc: "음성 복제 및 합성", theme: "blue", domain: "filme.imyfone.com" },
  { id: "soundful", category: "오디오", name: "Soundful", tier: "일반", desc: "BGM 생성 전문", theme: "slate", domain: "soundful.com" },
  { id: "aiva", category: "오디오", name: "AIVA", tier: "심화", desc: "MIDI 에디터 및 AI 작곡", theme: "blue", domain: "aiva.ai" },
  { id: "lyria", category: "오디오", name: "Lyria", tier: "일반", desc: "구글 딥마인드 음악 생성", theme: "emerald", domain: "deepmind.google" },
  { id: "udio", category: "오디오", name: "Udio AI", tier: "일반", desc: "Suno의 최대 경쟁자 음악 생성", theme: "slate", domain: "udio.com" },

  // 코딩/자동화
  { id: "cursor", category: "코딩/자동화", name: "Cursor", tier: "필수", desc: "AI가 내장된 코드 에디터", theme: "slate", domain: "cursor.sh" },
  { id: "zapier", category: "코딩/자동화", name: "Zapier", tier: "심화", desc: "앱 연동 자동화 플랫폼", theme: "orange", domain: "zapier.com" },
  { id: "n8n", category: "코딩/자동화", name: "n8n", tier: "심화", desc: "노드 기반 워크플로우 자동화", theme: "rose", domain: "n8n.io" },
  { id: "replit", category: "코딩/자동화", name: "Replit", tier: "심화", desc: "웹 기반 클라우드 IDE", theme: "orange", domain: "replit.com" },
  { id: "lovable", category: "코딩/자동화", name: "Lovable", tier: "일반", desc: "쉬운 네이티브 코딩 도우미", theme: "emerald", domain: "lovable.dev" },
  { id: "make", category: "코딩/자동화", name: "Make", tier: "일반", desc: "마인드맵 방식 자동화", theme: "purple", domain: "make.com" },
  { id: "opal", category: "코딩/자동화", name: "Opal", tier: "일반", desc: "AI 헬프데스크 및 자동화", theme: "blue", domain: "opal.dev" },
  { id: "solapi", category: "코딩/자동화", name: "Solapi", tier: "일반", desc: "문자/카톡 API 연동", theme: "blue", domain: "solapi.com" },
  { id: "openclaw", category: "코딩/자동화", name: "OpenClaw", tier: "일반", desc: "보안주의 로컬 AI 에이전트", theme: "slate", domain: "github.com" },

  // 마케팅
  { id: "stibee", category: "마케팅", name: "Stibee", tier: "일반", desc: "이메일 뉴스레터 제작 및 발송", theme: "orange", domain: "stibee.com" },
  { id: "mailchimp", category: "마케팅", name: "Mailchimp", tier: "심화", desc: "글로벌 이메일 마케팅 자동화", theme: "orange", domain: "mailchimp.com" },
  { id: "salesmap", category: "마케팅", name: "Sales Map", tier: "일반", desc: "B2B 세일즈 CRM", theme: "slate", domain: "salesmap.co.kr" },
  { id: "hubspot", category: "마케팅", name: "Hubspot", tier: "심화", desc: "CRM 및 인바운드 마케팅 자동화", theme: "orange", domain: "hubspot.com" }
];

const mappedTools = tools.map(t => {
  let pColor = "#000000";
  if (t.theme === "emerald") pColor = "#10b981";
  else if (t.theme === "orange") pColor = "#f97316";
  else if (t.theme === "blue") pColor = "#3b82f6";
  else if (t.theme === "slate") pColor = "#64748b";
  else if (t.theme === "purple") pColor = "#a855f7";
  else if (t.theme === "rose") pColor = "#f43f5e";
  else if (t.theme === "indigo") pColor = "#6366f1";

  let anim = "animate-fade-in-up";
  if (t.category === "비디오") anim = "animate-blur-in";
  if (t.category === "코딩/자동화") anim = "animate-slide-down";
  if (t.category === "이미지") anim = "animate-pop-in";

  return {
    id: t.id,
    category: t.category,
    name: t.name,
    site: "https://" + t.domain,
    type: t.tier === "필수" ? "부분 무료" : "무료",
    tier: t.tier,
    description: t.desc,
    themeColor: t.theme,
    favicon: "https://www.google.com/s2/favicons?domain=" + t.domain + "&sz=128",
    thumbnailVideo: "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4",
    designToken: {
      fontFamily: "system-ui, sans-serif",
      primaryColor: pColor,
      backgroundColor: "#ffffff",
      textColor: "#000000",
      borderRadius: "16px",
      borderStyle: "1px solid #e5e5e5",
      buttonStyle: "bg-[" + pColor + "] text-white px-4 py-2 rounded-lg shadow-sm hover:opacity-90",
      animationClass: anim
    },
    useCases: []
  };
});

fs.writeFileSync('src/data/tools.json', JSON.stringify(mappedTools, null, 2));
console.log("Successfully generated src/data/tools.json");
