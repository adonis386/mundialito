import Link from "next/link";
import { ChevronRight, Trophy } from "lucide-react";

type Slot =
  | { kind: "fixed"; label: string }
  | { kind: "thirdPool"; label: string; pools: string[] };

type KnockoutMatch = {
  id: string;
  home: Slot;
  away: Slot;
};

function SlotBadge({ slot }: { slot: Slot }) {
  if (slot.kind === "thirdPool") {
    return (
      <div className="flex flex-col gap-0.5">
        <div className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-500">{slot.label}</div>
        <div className="text-[11px] font-semibold text-slate-700">
          Entre:{" "}
          <span className="font-black text-[#3c0007]">
            {slot.pools.join(" / ")}
          </span>
        </div>
      </div>
    );
  }

  return <div className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-500">{slot.label}</div>;
}

function TeamRow({ slot, muted = false }: { slot: Slot; muted?: boolean }) {
  return (
    <button
      type="button"
      className={[
        "flex w-full items-center justify-between gap-3 rounded-xl bg-white px-4 py-3 text-left shadow-sm transition-colors duration-200 ease-out hover:bg-[#ffdad9]/35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3c0007]/20",
        muted ? "opacity-60" : "",
      ].join(" ")}
    >
      <SlotBadge slot={slot} />
      <ChevronRight className="h-4 w-4 text-slate-300" aria-hidden />
    </button>
  );
}

function MatchCard({ match }: { match: KnockoutMatch }) {
  return (
    <article className="rounded-2xl bg-white p-5 shadow-[0_24px_48px_rgba(26,28,28,0.04)]">
      <div className="flex items-center justify-between gap-3">
        <div className="text-[10px] font-black uppercase tracking-[0.25em] text-[#3c0007]">{match.id}</div>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-slate-600">
          TBD
        </span>
      </div>

      <div className="mt-3 flex flex-col gap-2 rounded-2xl bg-[#f3f3f3] p-1">
        <TeamRow slot={match.home} muted={match.home.kind === "fixed" && match.home.label === "TBD"} />
        <TeamRow slot={match.away} muted={match.away.kind === "fixed" && match.away.label === "TBD"} />
      </div>
    </article>
  );
}

const R32: KnockoutMatch[] = [
  {
    id: "Dieciseisavos 1",
    home: { kind: "fixed", label: "1° Grupo A" },
    away: { kind: "thirdPool", label: "3° lugar", pools: ["Grupo C", "E", "F", "H", "I"] },
  },
  {
    id: "Dieciseisavos 2",
    home: { kind: "fixed", label: "1° Grupo B" },
    away: { kind: "thirdPool", label: "3° lugar", pools: ["Grupo E", "F", "G", "I", "J"] },
  },
  {
    id: "Dieciseisavos 3",
    home: { kind: "fixed", label: "2° Grupo A" },
    away: { kind: "fixed", label: "2° Grupo B" },
  },
  {
    id: "Dieciseisavos 4",
    home: { kind: "fixed", label: "1° Grupo E" },
    away: { kind: "thirdPool", label: "3° lugar", pools: ["Grupo A", "B", "C", "D", "F"] },
  },
];

function makeTbdMatches(roundLabel: string, count: number, startAt = 1) {
  const out: KnockoutMatch[] = [];
  for (let i = startAt; i < startAt + count; i += 1) {
    out.push({
      id: `${roundLabel} ${i}`,
      home: { kind: "fixed", label: "TBD" },
      away: { kind: "fixed", label: "TBD" },
    });
  }
  return out;
}

export default function PlayoffsPage() {
  const rounds = [
    {
      key: "r32",
      title: "Dieciseisavos",
      subtitle: "32 equipos",
      matches: [...R32, ...makeTbdMatches("Dieciseisavos", 12, R32.length + 1)],
    },
    { key: "r16", title: "Octavos", subtitle: "16 equipos", matches: makeTbdMatches("Octavos", 8) },
    { key: "qf", title: "Cuartos", subtitle: "8 equipos", matches: makeTbdMatches("Cuartos", 4) },
    { key: "sf", title: "Semifinales", subtitle: "4 equipos", matches: makeTbdMatches("Semifinal", 2) },
  ] as const;

  return (
    <div className="relative overflow-hidden rounded-3xl">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: "url(/assets/wallpaper.jpg)" }}
      />
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#f9f9f9]/90 via-[#f9f9f9]/70 to-[#f9f9f9]" />

      <div className="relative flex flex-col gap-10 p-4 sm:p-6">
      <header className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-[#9ff4c9]/50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.25em] text-[#096c4b]">
            Live bracket
          </span>
          <span className="rounded-full bg-white/70 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-slate-600 shadow-sm">
            Mundial 2026
          </span>
        </div>

        <h1 className="text-3xl font-black italic tracking-tighter text-slate-900 sm:text-4xl">
          Fase eliminatoria
        </h1>
        <p className="max-w-2xl text-sm text-slate-700">
          De los 12 grupos avanzan <span className="font-bold">32 equipos</span>: los{" "}
          <span className="font-bold">2 mejores</span> de cada grupo (24) + los{" "}
          <span className="font-bold">8 mejores terceros</span>. Desde allí, todo es
          eliminación directa.
        </p>
      </header>

      <section className="grid gap-4 rounded-2xl bg-white p-6 shadow-[0_24px_48px_rgba(26,28,28,0.04)]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-[10px] font-black uppercase tracking-[0.25em] text-[#3c0007]">
              Estructura de llaves
            </div>
            <div className="mt-1 text-sm font-semibold text-slate-900">
              5 rondas (incluye Dieciseisavos)
            </div>
          </div>
          <Link
            href="/groups"
            className="cursor-pointer rounded-full bg-slate-100 px-4 py-2 text-xs font-bold uppercase tracking-widest text-slate-900 transition-colors duration-200 ease-out hover:bg-[#3c0007]/10 hover:text-[#3c0007]"
          >
            Ver grupos
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {[
            { label: "Dieciseisavos", value: "32" },
            { label: "Octavos", value: "16" },
            { label: "Cuartos", value: "8" },
            { label: "Semis", value: "4" },
            { label: "Final / 3er puesto", value: "2" },
          ].map((x) => (
            <div key={x.label} className="rounded-xl bg-[#f3f3f3] p-1">
              <div className="rounded-lg bg-white px-4 py-3">
                <div className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-500">
                  {x.label}
                </div>
                <div className="mt-1 text-2xl font-black italic tracking-tight text-[#3c0007]">
                  {x.value}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="text-[11px] text-slate-500">
          La final del Mundial 2026 es el <span className="font-semibold">19 de julio de 2026</span>.
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <header className="flex flex-col gap-1">
          <div className="text-xs font-black uppercase tracking-[0.25em] text-[#3c0007]">Bracket</div>
          <p className="text-sm text-slate-700">
            Vista clásica por rondas (scroll horizontal en móvil). Luego conectamos standings para reemplazar los TBD.
          </p>
        </header>

        <div className="overflow-x-auto pb-6">
          <div className="min-w-max">
            <div className="flex items-start gap-6 pr-2">
              {rounds.map((round) => (
                <section key={round.key} className="w-[20rem] shrink-0">
                  <div className="mb-3">
                    <div className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-500">
                      {round.title}
                    </div>
                    <div className="text-sm font-semibold text-slate-900">{round.subtitle}</div>
                  </div>

                  <div className="flex flex-col gap-4">
                    {round.matches.map((m) => (
                      <MatchCard key={m.id} match={m} />
                    ))}
                  </div>
                </section>
              ))}

              <section className="w-[22rem] shrink-0">
                <div className="mb-3">
                  <div className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-500">Final</div>
                  <div className="text-sm font-semibold text-slate-900">Campeón · 19 JUL 2026</div>
                </div>

                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#3c0007] to-[#630012] p-6 text-white shadow-[0_40px_80px_rgba(26,28,28,0.10)]">
                  <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-[#ff5d66]/20 blur-2xl" aria-hidden />
                  <div className="absolute -left-12 -bottom-12 h-40 w-40 rounded-full bg-[#9ff4c9]/10 blur-2xl" aria-hidden />

                  <div className="flex items-center gap-3">
                    <div className="rounded-2xl bg-white/10 p-3 ring-1 ring-white/15">
                      <Trophy className="h-6 w-6 text-white" aria-hidden />
                    </div>
                    <div>
                      <div className="text-[10px] font-black uppercase tracking-[0.25em] text-white/70">Grand final</div>
                      <div className="text-lg font-black italic tracking-tight">Selecciona tu campeón</div>
                    </div>
                  </div>

                  <div className="mt-5 grid gap-2 rounded-2xl bg-white/10 p-2 ring-1 ring-white/10">
                    <div className="rounded-xl bg-white/10 px-4 py-3 text-sm font-semibold text-white/70">Finalista A (TBD)</div>
                    <div className="rounded-xl bg-white/10 px-4 py-3 text-sm font-semibold text-white/70">Finalista B (TBD)</div>
                  </div>

                  <button
                    type="button"
                    disabled
                    className="mt-4 inline-flex w-full cursor-not-allowed items-center justify-center rounded-full bg-white/15 px-4 py-3 text-xs font-bold uppercase tracking-widest text-white/70"
                  >
                    Bloqueado (próximamente)
                  </button>
                </div>
              </section>
            </div>
          </div>
        </div>
      </section>
      </div>
    </div>
  );
}

