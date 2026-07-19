import React from 'react';

interface RadarChartProps {
  stats: {
    intelligence: number;
    willpower: number;
    autonomy: number;
    cooperation: number;
    sensibility: number;
  };
  size?: number;
}

export const RadarChart: React.FC<RadarChartProps> = ({ stats, size = 300 }) => {
  const center = size / 2;
  const maxVal = 100;
  const radius = (size / 2) * 0.75;

  // 5개 축의 라벨 및 값 정의
  const keys: Array<{ label: string; key: keyof typeof stats; color: string }> = [
    { label: '지력 (INT)', key: 'intelligence', color: '#60A5FA' },
    { label: '성실성 (WIL)', key: 'willpower', color: '#34D399' },
    { label: '주도성 (AUT)', key: 'autonomy', color: '#FBBF24' },
    { label: '협동심 (COP)', key: 'cooperation', color: '#F472B6' },
    { label: '감성 (SEN)', key: 'sensibility', color: '#A78BFA' }
  ];

  const angleStep = (Math.PI * 2) / keys.length;

  // 특정 축의 각도와 반지름 기준으로 좌표 계산
  const getCoordinates = (index: number, value: number) => {
    const angle = angleStep * index - Math.PI / 2; // 위쪽부터 시계방향
    const r = (value / maxVal) * radius;
    return {
      x: center + r * Math.cos(angle),
      y: center + r * Math.sin(angle)
    };
  };

  // 배경 가이드 오각형 생성
  const bgPolygons = [0.2, 0.4, 0.6, 0.8, 1.0].map((scale, i) => {
    const points = keys.map((_, idx) => {
      const { x, y } = getCoordinates(idx, maxVal * scale);
      return `${x},${y}`;
    }).join(' ');
    return (
      <polygon
        key={i}
        points={points}
        fill="none"
        stroke="#374151"
        strokeWidth="1"
        strokeDasharray={scale === 1 ? 'none' : '4,4'}
      />
    );
  });

  // 축 가이드선
  const axisLines = keys.map((_, idx) => {
    const { x, y } = getCoordinates(idx, maxVal);
    return (
      <line
        key={idx}
        x1={center}
        y1={center}
        x2={x}
        y2={y}
        stroke="#4B5563"
        strokeWidth="1"
      />
    );
  });

  // 실제 데이터 오각형 좌표 산출
  const dataPoints = keys.map((k, idx) => {
    const val = stats[k.key] || 0;
    const { x, y } = getCoordinates(idx, val);
    return { x, y, label: k.label, color: k.color, val };
  });

  const dataPolygonPoints = dataPoints.map(p => `${p.x},${p.y}`).join(' ');

  return (
    <div className="flex flex-col items-center justify-center p-2 bg-slate-900/50 backdrop-blur-md rounded-2xl border border-slate-700/50 shadow-2xl">
      <svg width={size} height={size} className="overflow-visible">
        {/* 오각형 배경선 */}
        {bgPolygons}
        
        {/* 중심축 그리드 선 */}
        {axisLines}

        {/* 데이터 영역 */}
        <polygon
          points={dataPolygonPoints}
          fill="rgba(139, 92, 246, 0.25)"
          stroke="#8B5CF6"
          strokeWidth="3"
          className="transition-all duration-500 ease-out"
        />

        {/* 데이터 꼭짓점 서클 및 텍스트 뱃지 */}
        {dataPoints.map((p, idx) => {
          // 텍스트 위치 보정용 오프셋 산출
          const angle = angleStep * idx - Math.PI / 2;
          const textDist = radius + 20;
          const tx = center + textDist * Math.cos(angle);
          const ty = center + textDist * Math.sin(angle) + 4; // y 축 보정

          return (
            <g key={idx}>
              <circle
                cx={p.x}
                cy={p.y}
                r="5"
                fill={p.color}
                className="transition-all duration-500 ease-out shadow-lg"
              />
              <text
                x={tx}
                y={ty}
                fill="#E2E8F0"
                fontSize="11"
                fontWeight="bold"
                textAnchor="middle"
                className="select-none font-sans"
              >
                {p.label.split(' ')[0]} ({p.val})
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
};
