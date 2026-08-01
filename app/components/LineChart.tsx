import Svg, { Polyline, Line } from "react-native-svg";

type Props = {
  basePath: number[];
  stressedPath: number[];
  width?: number;
  height?: number;
};

export function LineChart({ basePath, stressedPath, width = 320, height = 160 }: Props) {
  const all = [...basePath, ...stressedPath];
  const min = Math.min(...all);
  const max = Math.max(...all);
  const range = max - min || 1;

  const toPoints = (data: number[]) =>
    data
      .map((v, i) => {
        const x = (i / (data.length - 1)) * width;
        const y = height - ((v - min) / range) * height;
        return `${x},${y}`;
      })
      .join(" ");

  return (
    <Svg width={width} height={height}>
      <Line x1={0} y1={height} x2={width} y2={height} stroke="#e5e7eb" strokeWidth={1} />
      {/* 주황 실선(스트레스)을 먼저 그려서 뒤에 깔고 */}
      <Polyline points={toPoints(stressedPath)} fill="none" stroke="#f97316" strokeWidth={3} />
      {/* 짙은 점선(기본전망)을 나중에 그려서 항상 위에 보이도록 */}
      <Polyline
        points={toPoints(basePath)}
        fill="none"
        stroke="#1f2937"
        strokeWidth={2}
        strokeDasharray="6,5"
      />
    </Svg>
  );
}