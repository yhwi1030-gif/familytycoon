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
  const radius = (size / 2) * 0.58; // 반지름 비율을 0.75 -> 0.58로 축소하여 주변 라벨 텍스트와의 여유 공간 확보

  // 5개 축의 라벨 및 값 정의
  const keys: Array<{ label: string; key: keyof typeof stats; color: string }> = [
    { label: '지력 (INT)', key: 'intelligence', color: '#3B82F6' },
    { label: '성실성 (WIL)', key: 'willpower', color: '#10B981' },
    { label: '주도성 (AUT)', key: 'autonomy', color: '#F59E0B' },
    { label: '협동심 (COP)', key: 'cooperation', color: '#EC4899' },
    { label: '감성 (SEN)', key: 'sensibility', color: '#8B5CF6' }
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
        stroke="#E2E8F0"
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
        stroke="#E2E8F0"
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
    <div className="flex flex-col items-center justify-center p-4 bg-[#FAF8F5] rounded-2xl border border-[#EBE6DD] shadow-sm">
      <svg width={size} height={size} className="overflow-visible">
        {/* 오각형 배경선 */}
        {bgPolygons}
        
        {/* 중심축 그리드 선 */}
        {axisLines}

        {/* 데이터 영역 */}
        <polygon
          points={dataPolygonPoints}
          fill="rgba(99, 102, 241, 0.15)"
          stroke="#6366F1"
          strokeWidth="2.5"
          className="transition-all duration-500 ease-out"
        />

        {/* 데이터 꼭짓점 서클 및 텍스트 뱃지 */}
        {dataPoints.map((p, idx) => {
          // 텍스트 위치 보정용 오프셋 산출
          const angle = angleStep * idx - Math.PI / 2;
          const textDist = radius + 22;
          const tx = center + textDist * Math.cos(angle);
          const ty = center + textDist * Math.sin(angle) + 4; // y 축 보정

          return (
            <g key={idx}>
              <circle
                cx={p.x}
                cy={p.y}
                r="4.5"
                fill={p.color}
                className="transition-all duration-500 ease-out shadow-md"
              />
              <text
                x={tx}
                y={ty}
                fill="#475569"
                fontSize="10"
                fontWeight="black"
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
