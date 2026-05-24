import { createFileRoute, notFound, Outlet } from "@tanstack/react-router";
import { store } from "@/stores/mock-store";

export const Route = createFileRoute("/r/$slug")({
  loader: ({ params }) => {
    const r = store.getRestaurant(params.slug);
    if (!r) throw notFound();
    return { slug: params.slug };
  },
  component: () => <Outlet />,
});