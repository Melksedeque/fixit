import { Logo } from "@/components/ui/logo";
import Link from "next/link";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#F0F2F4] text-primary">
      <main className="flex flex-col items-center gap-8 text-center p-8 max-w-2xl">
        <h1>
          <Logo width={300} />
        </h1>
        <p className="text-xl">
          Sistema de chamados focado em comunicação rápida e gestão ágil.
        </p>
        <div className="flex gap-4 mt-8">
          <button className="cursor-pointer px-6 py-3 rounded-lg bg-[#48C9B0] text-[#1B365D] font-bold hover:opacity-90 hover:scale-110 hover:shadow-lg shadow-emerald-100 transition duration-300">
            <Link href="/login">Acessar Sistema</Link>
          </button>
        </div>
      </main>
    </div>
  );
}
