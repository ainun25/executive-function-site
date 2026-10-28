// "지구 수호대 작전"에 나오는 아군/적군 그림입니다.
// 색깔(초록/빨강)만으로 구분하면 색약 아동이 어려울 수 있어서, 모양 단서를 함께 둡니다.
//  - 1단계 행성: 아군=고리가 있는 행성 / 적군=뾰족한 가시가 있는 행성
//  - 2단계 UFO : 아군=동그란 불꽃 / 적군=뾰족한 불꽃
//  - 3단계 요원: 아군=맨눈 / 적군=검은 고글
export type EarthGuardLevel = 1 | 2 | 3;

interface StimulusProps {
  level: EarthGuardLevel;
  isAlly: boolean;
  size?: number;
}

const ALLY_COLOR = "#00ff88";
const ENEMY_COLOR = "#ff3333";

export default function EarthGuardStimulus({ level, isAlly, size = 176 }: StimulusProps) {
  if (level === 1) return <Planet isAlly={isAlly} size={size} />;
  if (level === 2) return <Ufo isAlly={isAlly} size={size} />;
  return <Agent isAlly={isAlly} size={size} />;
}

function Planet({ isAlly, size }: { isAlly: boolean; size: number }) {
  const gradientId = isAlly ? "eg-planet-ally" : "eg-planet-enemy";

  // 적군 행성의 가시: 행성 둘레에 뾰족한 삼각형 12개
  const spikes = Array.from({ length: 12 }, (_, index) => {
    const angle = (index * 30 * Math.PI) / 180;
    const halfWidth = (7 * Math.PI) / 180;
    const point = (radius: number, theta: number) =>
      `${(100 + radius * Math.cos(theta)).toFixed(1)},${(100 + radius * Math.sin(theta)).toFixed(1)}`;
    return `${point(54, angle - halfWidth)} ${point(84, angle)} ${point(54, angle + halfWidth)}`;
  });

  return (
    <svg
      viewBox="0 0 200 200"
      width={size}
      height={size}
      role="img"
      aria-label={isAlly ? "아군 행성 (고리가 있어요)" : "적군 행성 (뾰족한 가시가 있어요)"}
    >
      <defs>
        <radialGradient id={gradientId} cx="30%" cy="30%">
          <stop offset="0%" stopColor={isAlly ? "#a2ffcf" : "#ffaaaa"} />
          <stop offset="100%" stopColor={isAlly ? ALLY_COLOR : ENEMY_COLOR} />
        </radialGradient>
      </defs>
      {!isAlly && spikes.map((points) => <polygon key={points} points={points} fill="#b81f1f" />)}
      <circle cx="100" cy="100" r="58" fill={`url(#${gradientId})`} stroke="rgba(255,255,255,0.35)" strokeWidth="2" />
      {isAlly && (
        <ellipse
          cx="100"
          cy="100"
          rx="88"
          ry="22"
          fill="none"
          stroke="#e6fff5"
          strokeWidth="7"
          transform="rotate(-20 100 100)"
        />
      )}
    </svg>
  );
}

function Ufo({ isAlly, size }: { isAlly: boolean; size: number }) {
  const flameColor = isAlly ? ALLY_COLOR : ENEMY_COLOR;
  return (
    <svg
      viewBox="0 0 200 200"
      width={size}
      height={size}
      role="img"
      aria-label={isAlly ? "아군 UFO (동그란 불꽃)" : "적군 UFO (뾰족한 불꽃)"}
    >
      {isAlly ? (
        <ellipse className="ef-flicker" cx="100" cy="150" rx="30" ry="22" fill={flameColor} opacity="0.95" />
      ) : (
        <polygon
          className="ef-flicker"
          points="74,126 64,172 84,150 92,186 100,152 108,186 116,150 136,172 126,126"
          fill={flameColor}
          opacity="0.95"
        />
      )}
      <path d="M62 102 Q100 38 138 102 Z" fill="#8fd3ff" stroke="#d7efff" strokeWidth="2" />
      <ellipse cx="100" cy="106" rx="66" ry="18" fill="#9aa7bd" stroke="#d3dbe8" strokeWidth="2" />
      <circle cx="68" cy="108" r="4" fill="#ffe27a" />
      <circle cx="100" cy="112" r="4" fill="#ffe27a" />
      <circle cx="132" cy="108" r="4" fill="#ffe27a" />
    </svg>
  );
}

function Agent({ isAlly, size }: { isAlly: boolean; size: number }) {
  return (
    <svg
      viewBox="0 0 200 200"
      width={size}
      height={size}
      role="img"
      aria-label={isAlly ? "아군 요원 (맨눈)" : "적군 요원 (검은 고글을 썼어요)"}
    >
      <ellipse cx="100" cy="98" rx="54" ry="66" fill="#86f06f" stroke="#2f7a2a" strokeWidth="3" />
      {isAlly ? (
        <>
          <ellipse cx="78" cy="92" rx="14" ry="21" fill="#0b0b0b" />
          <ellipse cx="122" cy="92" rx="14" ry="21" fill="#0b0b0b" />
          <circle cx="74" cy="84" r="4" fill="#fff" />
          <circle cx="118" cy="84" r="4" fill="#fff" />
          <path d="M82 142 Q100 156 118 142" fill="none" stroke="#2f7a2a" strokeWidth="4" strokeLinecap="round" />
        </>
      ) : (
        <>
          <rect x="38" y="70" width="124" height="44" rx="14" fill="#000" stroke="#555" strokeWidth="3" />
          <rect x="52" y="80" width="30" height="8" rx="4" fill="#4a4a4a" />
          <rect x="118" y="80" width="30" height="8" rx="4" fill="#4a4a4a" />
          <path d="M84 146 L116 146" stroke="#2f7a2a" strokeWidth="4" strokeLinecap="round" />
        </>
      )}
    </svg>
  );
}
