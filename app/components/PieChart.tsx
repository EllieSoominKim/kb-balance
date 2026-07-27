import { View } from "react-native";
import Svg, { Path, Circle } from "react-native-svg";

type Slice = { label: string; value: number; color: string };

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const angleRad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(angleRad), y: cy + r * Math.sin(angleRad) };
}

function describeArc(cx: number, cy: number, r: number, startAngle: number, endAngle: number) {
  const start = polarToCartesian(cx, cy, r, endAngle);
  const end = polarToCartesian(cx, cy, r, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
  return `M ${cx} ${cy} L ${start.x} ${start.y} A ${r} ${r} 0 ${largeArcFlag} 0 ${end.x} ${end.y} Z`;
}

export function PieChart({ data, size = 240 }: { data: Slice[]; size?: number }) {
  const total = data.reduce((sum, d) => sum + d.value, 0);
  const radius = size / 2;
  let currentAngle = 0;

  if (total === 0) {
    return (
      <View style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }}>
        <Svg width={size} height={size}>
          <Circle cx={radius} cy={radius} r={radius - 2} fill="#e5e7eb" />
        </Svg>
      </View>
    );
  }

  const slices = data.map((d) => {
    const angle = (d.value / total) * 360;
    const startAngle = currentAngle;
    const endAngle = currentAngle + angle;
    currentAngle = endAngle;
    return { ...d, startAngle, endAngle };
  });

  return (
    <Svg width={size} height={size}>
      {slices.map((s) => (
        <Path
          key={s.label}
          d={describeArc(radius, radius, radius - 2, s.startAngle, s.endAngle)}
          fill={s.color}
        />
      ))}
    </Svg>
  );
}