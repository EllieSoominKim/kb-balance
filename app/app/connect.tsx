import { View, Text, Pressable, ScrollView } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { personas } from "../data/personas";
import { Header } from "../components/Header";

const INSTITUTIONS = [
  { key: "bank", label: "은행", example: "KB국민은행 등" },
  { key: "card", label: "카드", example: "KB국민카드 등" },
  { key: "securities", label: "증권", example: "KB증권 등" },
];

function Checkbox({ checked }: { checked: boolean }) {
  return (
    <View
      style={{
        width: 22,
        height: 22,
        borderRadius: 6,
        backgroundColor: checked ? "#fbbf24" : "white",
        borderWidth: checked ? 0 : 1.5,
        borderColor: "#d1d5db",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {checked && <Text style={{ color: "#1f2937", fontWeight: "bold", fontSize: 14 }}>✓</Text>}
    </View>
  );
}

export default function ConnectScreen() {
  const { personaId } = useLocalSearchParams<{ personaId: string }>();
  const router = useRouter();
  const persona = personas.find((p) => p.id === personaId);

  const [institutions, setInstitutions] = useState({ bank: true, card: true, securities: true });
  const [agreements, setAgreements] = useState({ all: true, credit: true, mydata: true });

  const toggleInstitution = (key: string) => {
    setInstitutions((prev) => ({ ...prev, [key]: !prev[key as keyof typeof prev] }));
  };

  const toggleAll = () => {
    const next = !agreements.all;
    setAgreements({ all: next, credit: next, mydata: next });
  };

  const toggleSingle = (key: "credit" | "mydata") => {
    setAgreements((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      next.all = next.credit && next.mydata;
      return next;
    });
  };

  const canProceed = agreements.credit && agreements.mydata;

  return (
    <ScrollView style={{ flex: 1, backgroundColor: "white", paddingHorizontal: 20, paddingTop: 64 }}>
      <Header />

      <Pressable onPress={() => router.back()} style={{ marginBottom: 16 }}>
        <Text style={{ color: "#6b7280" }}>← 뒤로</Text>
      </Pressable>

      <Text style={{ fontSize: 22, fontWeight: "bold", marginBottom: 8 }}>
        연결할 금융업권을{"\n"}선택하세요
      </Text>
      <Text style={{ color: "#6b7280", marginBottom: 20 }}>
        업권을 선택하면 해당 업권의 연결 가능한 금융회사가 자동으로 포함돼요.
      </Text>

      <View style={{ borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 12, marginBottom: 20 }}>
        {INSTITUTIONS.map((inst, i) => (
          <Pressable
            key={inst.key}
            onPress={() => toggleInstitution(inst.key)}
            style={{
              flexDirection: "row",
              alignItems: "center",
              padding: 16,
              borderBottomWidth: i < INSTITUTIONS.length - 1 ? 1 : 0,
              borderBottomColor: "#f3f4f6",
            }}
          >
            <Checkbox checked={institutions[inst.key as keyof typeof institutions]} />
            <View style={{ marginLeft: 12, flex: 1 }}>
              <Text style={{ fontWeight: "bold", fontSize: 15 }}>{inst.label}</Text>
              <Text style={{ color: "#9ca3af", fontSize: 12, marginTop: 2 }}>{inst.example}</Text>
            </View>
            <Text style={{ color: institutions[inst.key as keyof typeof institutions] ? "#16a34a" : "#9ca3af", fontSize: 12 }}>
              {institutions[inst.key as keyof typeof institutions] ? "연결됨" : "연결 안 됨"}
            </Text>
          </Pressable>
        ))}
      </View>

      <Text style={{ color: "#9ca3af", fontSize: 13, marginBottom: 20 }}>+ 개별 금융회사 직접 선택</Text>

      <View style={{ borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 12, marginBottom: 24 }}>
        <Pressable
          onPress={toggleAll}
          style={{ flexDirection: "row", alignItems: "center", padding: 16, borderBottomWidth: 1, borderBottomColor: "#f3f4f6" }}
        >
          <Checkbox checked={agreements.all} />
          <Text style={{ marginLeft: 12, fontWeight: "bold" }}>전체 동의</Text>
        </Pressable>
        <Pressable
          onPress={() => toggleSingle("credit")}
          style={{ flexDirection: "row", alignItems: "center", padding: 16, borderBottomWidth: 1, borderBottomColor: "#f3f4f6" }}
        >
          <Checkbox checked={agreements.credit} />
          <Text style={{ marginLeft: 12 }}>개인신용정보 제공 동의</Text>
        </Pressable>
        <Pressable
          onPress={() => toggleSingle("mydata")}
          style={{ flexDirection: "row", alignItems: "center", padding: 16 }}
        >
          <Checkbox checked={agreements.mydata} />
          <Text style={{ marginLeft: 12 }}>마이데이터 표준 API 이용약관</Text>
        </Pressable>
      </View>

      <Pressable
        disabled={!canProceed}
        style={{
          backgroundColor: canProceed ? "#fbbf24" : "#e5e7eb",
          borderRadius: 12,
          paddingVertical: 16,
          alignItems: "center",
          marginBottom: 40,
        }}
        onPress={() => router.push({ pathname: "/loading", params: { personaId } })}
      >
        <Text style={{ fontWeight: "bold", color: canProceed ? "#1f2937" : "#9ca3af" }}>
          자산 조회 시작하기
        </Text>
      </Pressable>
    </ScrollView>
  );
}