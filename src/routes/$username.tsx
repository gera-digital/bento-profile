import { createFileRoute } from "@tanstack/react-router";
import { ProfilePage } from "@/components/ProfilePage";

export const Route = createFileRoute("/$username")({
  head: ({ params }) => ({
    meta: [
      { title: `@${params.username} — NewPort Folio` },
      { name: "description", content: `Portfólio bento de @${params.username}` },
      { property: "og:title", content: `@${params.username} — NewPort Folio` },
      { property: "og:description", content: `Portfólio bento de @${params.username}` },
    ],
  }),
  component: () => {
    const { username } = Route.useParams();
    return <ProfilePage username={username} />;
  },
});
