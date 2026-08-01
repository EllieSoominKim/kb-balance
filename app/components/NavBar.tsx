import { View, Text, Pressable } from "react-native";
import { useRouter } from "expo-router";

type Props = {
  active: "dashboard" | "simulation" | "allocation";
  personaId?: string;
  goal?: string;
  onBack: () => void;
};

const TABS: { key: Props["active"]; label: string; path: string }[] = [
  { key: "dashboard", label: "대시보드", path: "/dashboard" },
  { key: "simulation", label: "시뮬레이션", path: "/simulation" },
  { key: "allocation", label: "추천 배분", path: "/allocation" },
];

export function NavBar({ active, personaId, goal, onBack }: Props) {
  const router = useRouter();

  return (
    <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
      <Pressable
        onPress={onBack}
        style={{
          backgroundColor: "#fef3c7",
          borderRadius: 999,
          paddingVertical: 10,
          paddingHorizontal: 18,
        }}
      >
        <Text style={{ fontWeight: "bold", fontSize: 14 }}>뒤로</Text>
      </Pressable>

      <View style={{ flexDirection: "row", backgroundColor: "#f3f4f6", borderRadius: 999, padding: 4 }}>
        {TABS.map((tab) => {
          const isActive = tab.key === active;
          return (
            <Pressable
              key={tab.key}
              onPress={() => router.push({ pathname: tab.path, params: { personaId, goal } })}
              style={{
                paddingVertical: 8,
                paddingHorizontal: 14,
                borderRadius: 999,
                backgroundColor: isActive ? "white" : "transparent",
              }}
            >
              <Text style={{ fontSize: 13, fontWeight: isActive ? "bold" : "normal", color: isActive ? "#1f2937" : "#9ca3af" }}>
                {tab.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}