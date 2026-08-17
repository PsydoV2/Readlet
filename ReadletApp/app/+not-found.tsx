import { Text, View } from "@/src/components/Themed";
import { Link } from "expo-router";
import { useTranslation } from "react-i18next";

export default function NotFound() {
  const { t } = useTranslation();

  return (
    <View
      style={{
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
      }}
    >
      <Text style={{ fontSize: 20, fontWeight: "700" }}>{t("notFound.title")}</Text>
      <Text style={{ marginTop: 8, opacity: 0.8 }}>{t("notFound.subtitle")}</Text>
      <Link href={"/"}>
        <Text>{t("notFound.backHome")}</Text>
      </Link>
    </View>
  );
}
