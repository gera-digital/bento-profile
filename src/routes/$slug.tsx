import { createFileRoute } from "@tanstack/react-router";
import { ProfilePage } from "@/components/ProfilePage";

export const Route = createFileRoute("/$slug")({
  head: ({ params }) => ({
    meta: [{ title: `@${params.slug} — NoCode Folio` }],
  }),
  component: SlugPage,
});

function SlugPage() {
  const { slug } = Route.useParams();
  return <ProfilePage slug={slug} />;
}
