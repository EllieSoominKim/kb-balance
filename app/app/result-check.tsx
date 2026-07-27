import { View, Text } from "react-native";
import { useLocalSearchParams } from "expo-router";

export default function ResultCheckScreen() {
  const params = useLocalSearchParams<{
    personaName: string;
    selfReported: string;
    calibrated: string;
    adjusted: string;
    reason: string;
  }>();

  return (
    <View style={{ flex: 1, backgroundColor: "white", paddingHorizontal: 20, paddingTop: 80 }}>
      <Text style={{ fontSize: 20, fontWeight: "bold", marginBottom: 24 }}>
        ✅ API 연동 확인용 임시 화면
      </Text>

      <Text style={{ fontSize: 16, marginBottom: 8 }}>페르소나: {params.personaName}</Text>
      <Text style={{ fontSize: 16, marginBottom: 8 }}>자기응답 리스크: {params.selfReported}</Text>
      <Text style={{ fontSize: 16, marginBottom: 8 }}>보정된 리스크: {params.calibrated}</Text>
      <Text style={{ fontSize: 16, marginBottom: 8 }}>보정 여부: {params.adjusted}</Text>
      {params.reason ? (
        <Text style={{ fontSize: 14, color: "#6b7280", marginTop: 8 }}>
          보정 사유: {params.reason}
        </Text>
      ) : null}
    </View>
  );
}