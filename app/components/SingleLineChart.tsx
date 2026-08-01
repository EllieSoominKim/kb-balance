import Svg, { Polyline, Line } from "react-native-svg";

type Props = {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
};

export function SingleLineChart({ data, width = 320, height = 160, color = "#f97316" }: Props) {
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  const points = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * width;
      const y = height - ((v - min) / range) * height;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <Svg width={width} height={height}>
      <Line x1={0} y1={height} x2={width} y2={height} stroke="#e5e7eb" strokeWidth={1} />
      <Polyline points={points} fill="none" stroke={color} strokeWidth={2.5} />
    </Svg>
  );
}