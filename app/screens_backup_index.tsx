// app/index.tsx
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
    <View className="flex-1 bg-white px-5 pt-16">
      <Text className="text-lg font-bold text-gray-800 mb-6">KB 밸런스</Text>

      <View className="bg-gray-100 rounded-2xl p-6 items-center">
        {/* 캐릭터 일러스트는 추후 이미지 에셋으로 교체 */}
        <View className="w-full h-48 bg-gray-200 rounded-xl mb-6" />

        <Text className="text-2xl font-bold text-center mb-3">
          계좌를 연결하고 시작하세요
        </Text>
        <Text className="text-gray-500 text-center mb-6">
          자산·부채·소득을 한 번에 불러와{'\n'}맞춤 리스크 진단을 시작합니다.
        </Text>

        {features.map((f) => (
          <View key={f.title} className="w-full bg-white rounded-xl p-4 mb-3">
            <Text className="font-bold text-gray-800">{f.title}</Text>
            <Text className="text-gray-500 text-sm mt-1">{f.desc}</Text>
          </View>
        ))}
      </View>

      <Pressable
        className="bg-yellow-400 rounded-xl py-4 items-center mt-6"
        onPress={() => router.push('/connect-institutions')}
      >
        <Text className="font-bold text-gray-900">KB계좌 연결하기</Text>
      </Pressable>
    </View>
  );
}