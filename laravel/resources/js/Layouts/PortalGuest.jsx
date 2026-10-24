import { Brand } from "@/Components/Office";

export default function PortalGuest({ children }) {
    return (
        <main className="grid min-h-screen lg:grid-cols-2 bg-sky-50/60">
            <section
                className="relative flex flex-col justify-between overflow-hidden bg-cover bg-center px-8 py-9 text-white shadow-xl lg:p-16"
                style={{
                    backgroundImage:
                        "linear-gradient(135deg, rgba(3, 105, 161, 0.88), rgba(7, 89, 133, 0.84), rgba(8, 47, 73, 0.92)), url('/images/20261020_153539.jpg')",
                }}
            >
                <Brand light />
                <div className="relative py-12 lg:py-20">
                    <div className="mb-6 h-1 w-12 rounded-full bg-sky-400" />
                    <p className="text-xs uppercase tracking-[.22em] text-sky-200/80 font-semibold">
                        Here for your next step
                    </p>
                    <h1 className="mt-5 max-w-lg font-sans font-bold text-4xl leading-tight lg:text-6xl text-white">
                        You don’t have to
                        <br />
                        figure it out alone.
                    </h1>
                    <p className="mt-7 max-w-sm text-sm leading-7 text-sky-100/80">
                        Connect with your university guidance office. Request a
                        conversation, find support, and make room for your
                        well-being.
                    </p>
                </div>
                <p className="text-xs text-sky-200/60 font-medium">
                    Bukidnon State University &bull; SWEU
                </p>
            </section>
            <section className="flex items-center justify-center px-6 py-12">
                <div className="w-full max-w-md rounded-2xl border border-sky-100 bg-white p-8 shadow-sm shadow-sky-900/5">
                    {children}
                </div>
            </section>
        </main>
    );
}
