import { View, Text, Image } from "react-native";

export function Header() {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 24 }}>
      <Image
        source={require("../assets/kb.png")}
        style={{ width: 26, height: 26, marginRight: 5}}
        resizeMode="contain"
      />
      <Text style={{ fontSize: 18, fontWeight: "bold", color: "#1f2937" }}>KB 밸런스</Text>
    </View>
  );
}