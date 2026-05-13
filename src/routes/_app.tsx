import { createFileRoute, redirect } from "@tanstack/react-router";
import { AppLayout } from "@/components/AppLayout";
import { getUser, getAgeOk } from "@/lib/destrava-store";

export const Route = createFileRoute("/_app")({
  beforeLoad: () => {
    if (typeof window === "undefined") return;
    if (!getAgeOk() || !getUser()) {
      throw redirect({ to: "/" });
    }
  },
  component: AppLayout,
});
