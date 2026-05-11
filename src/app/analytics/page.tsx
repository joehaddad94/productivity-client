import dynamic from "next/dynamic";

const AnalyticsScreen = dynamic(
  () => import("@/features/analytics").then((m) => ({ default: m.AnalyticsScreen })),
  { ssr: false }
);

export default function AnalyticsPage() {
  return <AnalyticsScreen />;
}
