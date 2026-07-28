import { Link, useParams } from "react-router";
import { ArrowLeft, Mail, MoreHorizontal, Search, UserPlus } from "lucide-react";

export function meta() {
  return [
    { title: "Manage People — Swiftstash" },
    { name: "description", content: "See and manage the people you've shared this file with." },
  ];
}

const PEOPLE = [
  { id: "u1", name: "You", email: "you@swiftstash.io", role: "Owner", initials: "AR", color: "from-secondary to-primary" },
  { id: "u2", name: "Priya Sharma", email: "priya@acme.com", role: "Editor", initials: "PS", color: "from-primary to-secondary-accent" },
  { id: "u3", name: "Daniel Kim", email: "dkim@acme.com", role: "Commenter", initials: "DK", color: "from-secondary-accent to-secondary" },
  { id: "u4", name: "Mia Torres", email: "mia.t@partner.io", role: "Viewer", initials: "MT", color: "from-primary-accent to-primary" },
  { id: "u5", name: "Ravi Patel", email: "ravi@vendor.co", role: "Viewer", initials: "RP", color: "from-secondary to-primary-accent" },
];

export default function ManagePeoplePage() {
  const { fileId } = useParams();

  return (
    <main className="flex-1 overflow-y-auto">
      <div className="max-w-3xl mx-auto px-6 py-8">
            <Link
              to="/drive"
              className="inline-flex items-center gap-2 text-sm text-text-secondary hover:text-text-main mb-4"
            >
              <ArrowLeft className="w-4 h-4" /> Back to My Drive
            </Link>

            <div className="flex items-start justify-between mb-6">
              <div>
                <h1 className="text-2xl font-semibold tracking-tight">Manage people</h1>
                <p className="text-sm text-text-secondary mt-1">
                  Control who has access to <span className="text-text-main">file #{fileId}</span> and what they can do.
                </p>
              </div>
              <button className="h-10 px-4 rounded-xl bg-primary hover:bg-primary-accent text-white text-sm font-medium inline-flex items-center gap-2 shadow-lg shadow-primary/25">
                <UserPlus className="w-4 h-4" /> Invite
              </button>
            </div>

            {/* Invite composer */}
            <div className="rounded-2xl border border-border-subtle bg-card-bg/60 p-4 mb-8">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-text-secondary" />
                <input
                  placeholder="Add people by email"
                  className="flex-1 bg-transparent outline-none text-sm placeholder:text-text-secondary/70"
                />
                <select className="bg-card-bg border border-border-subtle text-sm rounded-lg h-9 px-2 text-text-main outline-none">
                  <option>Viewer</option>
                  <option>Commenter</option>
                  <option>Editor</option>
                </select>
                <button className="h-9 px-3 rounded-lg bg-primary text-white text-sm hover:bg-primary-accent">
                  Send
                </button>
              </div>
            </div>

            {/* People list */}
            <div className="rounded-2xl border border-border-subtle bg-card-bg/40 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-border-subtle">
                <div className="text-sm font-medium">People with access</div>
                <div className="relative">
                  <Search className="w-4 h-4 text-text-secondary absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    placeholder="Filter"
                    className="h-8 pl-8 pr-3 rounded-md bg-background border border-border-subtle text-sm outline-none focus:border-primary/60"
                  />
                </div>
              </div>

              <ul className="divide-y divide-border-subtle">
                {PEOPLE.map((p) => (
                  <li
                    key={p.id}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-white/[0.02] transition-colors"
                  >
                    <div
                      className={
                        "w-10 h-10 rounded-full grid place-items-center text-white text-sm font-semibold bg-gradient-to-br " +
                        p.color
                      }
                    >
                      {p.initials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-text-main font-medium">
                        {p.name}
                        {p.role === "Owner" && (
                          <span className="ml-2 text-[10px] uppercase tracking-widest text-secondary-accent">
                            you
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-text-secondary truncate">{p.email}</div>
                    </div>
                    <select
                      defaultValue={p.role}
                      disabled={p.role === "Owner"}
                      className="bg-background border border-border-subtle rounded-lg h-9 px-2 text-sm text-text-main outline-none disabled:opacity-60"
                    >
                      <option>Owner</option>
                      <option>Editor</option>
                      <option>Commenter</option>
                      <option>Viewer</option>
                    </select>
                    <button className="w-9 h-9 grid place-items-center rounded-lg text-text-secondary hover:text-text-main hover:bg-white/[0.05]">
                      <MoreHorizontal className="w-4 h-4" />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
      </div>
    </main>
  );
}