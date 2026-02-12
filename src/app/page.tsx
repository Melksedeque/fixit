import Link from "next/link";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#1B365D] text-white">
      <main className="flex flex-col items-center gap-8 text-center p-8">
        <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
          Fixit
        </h1>
        <p className="text-lg text-[#48C9B0] max-w-xl">
          Sistema de chamados focado em comunicação rápida e gestão ágil.
        </p>
        <div className="flex gap-4 mt-8">
          <button className="cursor-pointer px-6 py-3 rounded-lg bg-[#48C9B0] text-[#1B365D] font-bold hover:opacity-90 transition">
            <Link href="/login">Acessar Sistema</Link>
          </button>
        </div>
      </main>
    </div>
  );
}
