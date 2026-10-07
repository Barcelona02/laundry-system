import { ArrowRight, BarChart3, ClipboardCheck, Clock, Search, Sparkles, Wallet, WashingMachine } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Logo } from '../components/layout/Logo'
import { LinkButton } from '../components/ui/Button'

const features = [
  {
    icon: ClipboardCheck,
    title: 'Rule-based order flow',
    text: 'Orders move from received to washing, drying, ready, and claimed with no skipped steps.',
    bubble: 'bg-brand-100 text-brand-600',
  },
  {
    icon: Wallet,
    title: 'Automatic billing',
    text: 'Per-kg or per-piece pricing, add-ons, rush fees, minimum charges, and running balances.',
    bubble: 'bg-accent-100 text-accent-600',
  },
  {
    icon: Clock,
    title: 'Pickup deadlines',
    text: 'Promised pickup times, late flags, and storage fees for laundry left unclaimed.',
    bubble: 'bg-emerald-50 text-emerald-600',
  },
  {
    icon: WashingMachine,
    title: 'Machine availability',
    text: 'Assign washers and dryers by capacity, with double-booking prevented.',
    bubble: 'bg-accent-100 text-accent-600',
  },
  {
    icon: BarChart3,
    title: 'Sales insights',
    text: 'Daily sales, top services, top customers, and average turnaround at a glance.',
    bubble: 'bg-emerald-50 text-emerald-600',
  },
  {
    icon: Search,
    title: 'Customer tracking',
    text: 'Customers check their laundry status and balance using their order code.',
    bubble: 'bg-brand-100 text-brand-600',
  },
]

const steps = [
  { title: 'Drop off', text: 'Staff logs the load and the system prices it instantly.' },
  { title: 'Wash & dry', text: 'Each stage is assigned a free machine that fits the load.' },
  { title: 'Pick up', text: 'Pay the balance and claim, with no surprises.' },
]

export default function Landing() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-canvas">
      {/* Malalambot na kulay sa background */}
      <div className="pointer-events-none absolute -top-40 -left-32 size-[28rem] rounded-full bg-brand-200/60 blur-3xl" />
      <div className="pointer-events-none absolute top-20 -right-40 size-[30rem] rounded-full bg-accent-200/60 blur-3xl" />

      <header className="relative mx-auto flex max-w-6xl items-center justify-between px-4 py-6 sm:px-6">
        <Logo />
        <nav className="flex items-center gap-2 sm:gap-5">
          <Link to="/track" className="hidden text-sm font-semibold text-slate-600 hover:text-brand-700 sm:block">
            Track order
          </Link>
          <LinkButton to="/dashboard" className="px-4 py-2 text-xs sm:px-5 sm:py-2.5 sm:text-sm">
            Dashboard
          </LinkButton>
        </nav>
      </header>

      {/* Hero */}
      <section className="relative mx-auto grid max-w-6xl items-center gap-14 px-4 pt-12 pb-24 sm:px-6 lg:grid-cols-2 lg:pt-20">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full border border-white bg-white/70 px-3.5 py-1.5 text-xs font-semibold text-brand-700 shadow-sm backdrop-blur">
            <Sparkles size={14} className="text-accent-500" /> Laundry management, made calm
          </span>
          <h1 className="mt-6 text-[2.6rem] leading-[1.1] font-semibold tracking-tight text-slate-900 sm:text-6xl">
            Fresh laundry,
            <br />
            <span className="bg-gradient-to-r from-brand-500 to-accent-500 bg-clip-text text-transparent">zero guesswork.</span>
          </h1>
          <p className="mt-6 max-w-lg text-lg leading-relaxed text-slate-500">
            Laundry System prices every order, schedules washers and dryers, tracks balances, and tells customers exactly
            when their clothes are ready.
          </p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <LinkButton to="/dashboard" className="px-7 py-3.5 text-base">
              Go to dashboard <ArrowRight size={18} />
            </LinkButton>
            <LinkButton to="/track" variant="secondary" className="px-7 py-3.5 text-base">
              <Search size={18} /> Track my laundry
            </LinkButton>
          </div>
        </div>

        {/* Preview card */}
        <div className="relative mx-auto w-full max-w-md">
          <div className="absolute -bottom-8 -left-8 z-10 hidden rounded-3xl border border-white bg-white/80 p-4 shadow-card backdrop-blur sm:block">
            <p className="text-xs text-slate-400">Today's sales</p>
            <p className="font-display text-2xl font-semibold text-slate-900">₱4,280</p>
          </div>
          <div className="rounded-[2rem] border border-white bg-white/90 p-7 shadow-card backdrop-blur">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-400">Order</p>
                <p className="font-display text-2xl font-semibold text-slate-900">LND-0042</p>
              </div>
              <span className="rounded-full bg-brand-100 px-3 py-1 text-xs font-semibold text-brand-700">Washing</span>
            </div>
            <div className="mt-6 space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">6 kg × ₱35 Wash-Dry-Fold</span>
                <span className="font-medium text-slate-800">₱210.00</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Fabcon + Folding</span>
                <span className="font-medium text-slate-800">₱40.00</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Paid (GCash)</span>
                <span className="font-medium text-slate-800">−₱100.00</span>
              </div>
              <div className="flex justify-between border-t border-slate-100 pt-3 text-base">
                <span className="font-semibold text-slate-800">Balance</span>
                <span className="font-display text-lg font-semibold text-due-600">₱150.00</span>
              </div>
            </div>
            <div className="mt-6 flex items-center gap-3 rounded-2xl bg-gradient-to-r from-brand-50 to-accent-50 p-3.5">
              <span className="grid size-9 place-items-center rounded-xl bg-white text-brand-600 shadow-sm">
                <WashingMachine size={18} />
              </span>
              <p className="text-sm text-slate-600">
                Running in <span className="font-semibold text-slate-900">W-02</span> · ready by 5:30 PM
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="relative bg-white py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <p className="text-center text-sm font-semibold tracking-wider text-brand-600 uppercase">Features</p>
          <h2 className="mt-2 text-center text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
            More than a list of orders
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-center text-slate-500">
            The system computes prices, balances, deadlines, and availability so staff can focus on the laundry.
          </p>
          <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {features.map(({ icon: Icon, title, text, bubble }) => (
              <div key={title} className="rounded-3xl bg-canvas p-7 transition hover:-translate-y-1 hover:shadow-card">
                <span className={`grid size-12 place-items-center rounded-2xl ${bubble}`}>
                  <Icon size={22} />
                </span>
                <h3 className="mt-5 text-lg font-semibold text-slate-900">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-500">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="relative mx-auto max-w-6xl px-4 py-24 sm:px-6">
        <p className="text-center text-sm font-semibold tracking-wider text-accent-600 uppercase">How it works</p>
        <h2 className="mt-2 text-center text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">Three simple steps</h2>
        <ol className="mt-14 grid gap-5 md:grid-cols-3">
          {steps.map((s, i) => (
            <li key={s.title} className="rounded-3xl border border-white bg-white p-7 shadow-card">
              <span className="grid size-11 place-items-center rounded-2xl bg-gradient-to-br from-brand-300 to-accent-400 font-display text-lg font-semibold text-white">
                {i + 1}
              </span>
              <h3 className="mt-5 text-lg font-semibold text-slate-900">{s.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-500">{s.text}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* CTA */}
      <section className="relative px-4 pb-24 sm:px-6">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-5 rounded-[2rem] bg-gradient-to-br from-brand-100 via-brand-50 to-accent-100 px-6 py-14 text-center sm:px-12">
          <h2 className="text-3xl font-semibold tracking-tight text-slate-900">Dropped off your laundry?</h2>
          <p className="max-w-md text-slate-600">Check its status and balance anytime with the code on your claim slip.</p>
          <LinkButton to="/track" className="px-7 py-3.5 text-base">
            <Search size={18} /> Track my laundry
          </LinkButton>
        </div>
      </section>

      <footer className="relative border-t border-slate-100 bg-white py-8 text-center text-sm text-slate-400">
        © {new Date().getFullYear()} Laundry System · CTADWEBL Final Project
      </footer>
    </div>
  )
}
