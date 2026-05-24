import { Suspense } from "react";
import SetPasswordPage from "@/components/portal/SetPasswordPage";

export default function Page() {
  return (
    <Suspense>
      <SetPasswordPage />
    </Suspense>
  );
}
