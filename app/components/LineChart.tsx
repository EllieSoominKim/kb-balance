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
      <Polyline points={toPoints(basePath)} fill="none" stroke="#9ca3af" strokeWidth={2} strokeDasharray="4,4" />
      <Polyline points={toPoints(stressedPath)} fill="none" stroke="#f97316" strokeWidth={2.5} />
    </Svg>
  );
}