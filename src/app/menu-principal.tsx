import Link from "next/link";

// Menu novo = um item a mais aqui. Passando de 5, o quinto vira "Mais".
const ITENS_MENU = [
  { id: "fidelidade", rotulo: "Fidelidade", href: "/", icone: IconeCartela },
  { id: "cupons", rotulo: "Cupons", href: "/cupons", icone: IconeCupom },
  { id: "reativar", rotulo: "Reativar", href: "/reativar", icone: IconeReativar },
] as const;

export type ItemMenu = (typeof ITENS_MENU)[number]["id"];

export function MenuPrincipal({ ativo }: { ativo: ItemMenu }) {
  return (
    <nav
      aria-label="Menu principal"
      className="fixed inset-x-0 bottom-0 z-20 border-t border-stone-200 bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur dark:border-stone-800"
    >
      <ul className="mx-auto flex max-w-md">
        {ITENS_MENU.map((item) => {
          const atual = item.id === ativo;
          const Icone = item.icone;
          return (
            <li key={item.id} className="flex-1">
              <Link
                href={item.href}
                aria-current={atual ? "page" : undefined}
                className={`flex h-16 flex-col items-center justify-center gap-1 text-xs font-medium transition focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-rose-600 ${
                  atual ? "text-rose-700 dark:text-rose-400" : "text-stone-500 hover:text-stone-800 dark:hover:text-stone-200"
                }`}
              >
                <Icone />
                {item.rotulo}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

function IconeCartela() {
  return (
    <svg aria-hidden viewBox="0 0 24 24" className="size-6" fill="currentColor">
      <circle cx="6" cy="9" r="2.2" />
      <circle cx="12" cy="9" r="2.2" />
      <circle cx="18" cy="9" r="2.2" />
      <circle cx="6" cy="15" r="2.2" />
      <circle cx="12" cy="15" r="2.2" />
      <circle cx="18" cy="15" r="2.2" fill="none" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  );
}

function IconeCupom() {
  return (
    <svg aria-hidden viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round">
      <path d="M3 8a2 2 0 0 0 2-2h14a2 2 0 0 0 2 2v2a2 2 0 0 0 0 4v2a2 2 0 0 0-2 2H5a2 2 0 0 0-2-2v-2a2 2 0 0 0 0-4Z" />
      <path d="M9 9.5h.01M15 14.5h.01M15 9.5l-6 5" strokeLinecap="round" />
    </svg>
  );
}

function IconeReativar() {
  return (
    <svg aria-hidden viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 12a8 8 0 1 0 2.4-5.7" />
      <path d="M4 4v4h4" />
      <path d="M12 8v4l2.5 2" />
    </svg>
  );
}
