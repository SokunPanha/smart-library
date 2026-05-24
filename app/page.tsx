import { redirect } from "next/navigation";

// next-intl middleware will add the detected locale prefix — redirect to /km as default
export default function RootPage() {
  redirect("/km");
}
