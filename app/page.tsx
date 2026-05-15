import { AppShell } from "@/components/app-shell";
import { LH_DISTRICTS, LH_LISTINGS } from "@/lib/lh-adapter";

export default function Page() {
  return <AppShell listings={LH_LISTINGS} districts={LH_DISTRICTS} />;
}
