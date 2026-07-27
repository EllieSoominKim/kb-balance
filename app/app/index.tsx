import { View, Text, Pressable } from 'react-native';
import { useRouter } from 'expo-router';

const features = [
  { title: '자산·부채 자동 조회', desc: '한 번에 불러오는 자산·부채 현황' },
  { title: '맞춤 리스크 진단', desc: '내 재무 상태에 맞춘 리스크 진단' },
  { title: '상환 vs 투자', desc: '상환과 투자, 최적 비율 추천' },
];

export default function IntroScreen() {
  const router = useRouter();

  return (
    <View style={{ flex: 1, backgroundColor: 'white', paddingHorizontal: 20, paddingTop: 64 }}>
      <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 24 }}>KB 밸런스</Text>

      <View style={{ backgroundColor: '#f3f4f6', borderRadius: 16, padding: 24, alignItems: 'center' }}>
        <View style={{ width: '100%', height: 192, backgroundColor: '#e5e7eb', borderRadius: 12, marginBottom: 24 }} />

        <Text style={{ fontSize: 24, fontWeight: 'bold', textAlign: 'center', marginBottom: 12 }}>
          계좌를 연결하고 시작하세요
        </Text>
        <Text style={{ color: '#6b7280', textAlign: 'center', marginBottom: 24 }}>
          자산·부채·소득을 한 번에 불러와{'\n'}맞춤 리스크 진단을 시작합니다.
        </Text>

        {features.map((f) => (
          <View key={f.title} style={{ width: '100%', backgroundColor: 'white', borderRadius: 12, padding: 16, marginBottom: 12 }}>
            <Text style={{ fontWeight: 'bold', color: '#1f2937' }}>{f.title}</Text>
            <Text style={{ color: '#6b7280', fontSize: 14, marginTop: 4 }}>{f.desc}</Text>
          </View>
        ))}
      </View>

      <Pressable
        style={{ backgroundColor: '#fbbf24', borderRadius: 12, paddingVertical: 16, alignItems: 'center', marginTop: 24 }}
        onPress={() => router.push('/persona-select')}
      >
        <Text style={{ fontWeight: 'bold', color: '#1f2937' }}>KB계좌 연결하기</Text>
      </Pressable>
    </View>
  );
}