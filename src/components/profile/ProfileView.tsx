import Image from "next/image";
import Link from "next/link";

export interface ProfileViewProfile {
  username: string;
  display_name: string;
  bio: string | null;
  avatar_url: string | null;
}

export interface ProfileViewLink {
  id: string;
  title: string;
  url: string;
  icon: string | null;
}

interface ProfileViewProps {
  profile: ProfileViewProfile;
  links: ProfileViewLink[];
}

export function ProfileView({ profile, links }: ProfileViewProps) {
  const initial = profile.display_name.trim().charAt(0).toUpperCase() || "?";

  return (
    <main className="mx-auto w-full max-w-md flex-1 px-4 py-12 flex flex-col items-center">
      <header className="flex flex-col items-center gap-3 mb-8 text-center">
        {profile.avatar_url ? (
          <Image
            src={profile.avatar_url}
            alt={profile.display_name}
            width={80}
            height={80}
            className="size-20 rounded-full object-cover"
          />
        ) : (
          <div
            aria-hidden
            className="size-20 rounded-full bg-accent text-accent-foreground flex items-center justify-center text-3xl font-bold font-display"
          >
            {initial}
          </div>
        )}
        <h1 className="text-2xl font-bold font-display">{profile.display_name}</h1>
        {profile.bio ? <p className="text-muted-foreground">{profile.bio}</p> : null}
      </header>

      <ul className="w-full flex flex-col gap-3" aria-label="Links">
        {links.map((link) => (
          <li key={link.id}>
            <Link
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full rounded-lg border border-border bg-card text-card-foreground px-4 py-3 text-center font-medium hover:bg-accent hover:text-accent-foreground transition-colors"
            >
              {link.title}
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
