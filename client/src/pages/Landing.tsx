import { BarChart3, ClipboardCheck, Clock, Search, Shirt, Sparkles, Wallet, WashingMachine } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Logo } from '../components/layout/Logo'
import { LinkButton } from '../components/ui/Button'

const features = [
  {
    icon: ClipboardCheck,
    title: 'Rule-based order flow',
    text: 'Orders move from received to washing, drying, ready, and claimed with no skipped steps.',
  },
  {
    icon: Wallet,
    title: 'Automatic billing',
    text: 'Per-kg or per-piece pricing, add-ons, rush fees, minimum charges, and running balances.',
  },
  {
    icon: Clock,
    title: 'Pickup deadlines',
    text: 'Promised pickup times, late flags, and storage fees for laundry left unclaimed.',
  },
  {
    icon: WashingMachine,
    title: 'Machine availability',
    text: 'Assign washers and dryers by capacity, with double-booking prevented.',
  },
  {
    icon: BarChart3,
    title: 'Sales insights',
    text: 'Daily sales, top services, top customers, and average turnaround at a glance.',
  },
  {
    icon: Search,
    title: 'Customer tracking',
    text: 'Customers check their laundry status and balance using their order code.',
  },
]

const steps = [
  { title: 'Drop off', text: 'Staff logs the load and the system prices it instantly.' },
  { title: 'Wash & dry', text: 'Each stage is assigned a free machine that fits the load.' },
  { title: 'Pick up', text: 'Pay the balance and claim, with no surprises.' },
]

export default function Landing() {
  return (
    <div className="min-h-screen bg-canvas">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-4 py-5 sm:px-6">
        <Logo />
        <nav className="flex items-center gap-2 sm:gap-4">
          <Link to="/track" className="hidden text-sm font-semibold text-slate-600 hover:text-brand-700 sm:block">
            Track order
          </Link>
          <LinkButton to="/dashboard">Open dashboard</LinkButton>
        </nav>
      </header>

      {/* Hero */}
      <section className="mx-auto grid max-w-6xl items-center gap-12 px-4 pt-10 pb-20 sm:px-6 lg:grid-cols-2 lg:pt-16">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full bg-brand-100 px-3 py-1 text-xs font-semibold text-brand-700">
            <Sparkles size={14} /> Built for neighborhood laundry shops
          </span>
          <h1 className="mt-5 text-4xl leading-tight font-extrabold tracking-tight text-slate-900 sm:text-5xl">
            Every load, <span className="text-brand-600">tracked</span> from drop-off to pickup.
          </h1>
          <p className="mt-5 max-w-lg text-lg text-slate-600">
            Laundry System prices each order, schedules machines, tracks balances, and tells customers exactly when their
            clothes are ready.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <LinkButton to="/dashboard" className="px-6 py-3 text-base">
              Go to dashboard
            </LinkButton>
            <LinkButton to="/track" variant="secondary" className="px-6 py-3 text-base">
              <Search size={18} /> Track my laundry
            </LinkButton>
          </div>
        </div>

        {/* Preview card */}
        <div className="relative">
          <div className="absolute -inset-4 -z-10 rounded-[2rem] bg-gradient-to-br from-brand-200 via-brand-100 to-accent-400/30 blur-2xl" />
          <div className="rounded-card bg-white p-6 shadow-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500">Order</p>
                <p className="text-xl font-extrabold text-slate-900">LND-0042</p>
              </div>
              <span className="rounded-full bg-sky-100 px-2.5 py-1 text-xs font-semibold text-sky-700">Washing</span>
            </div>
            <div className="mt-5 space-y-2.5 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-600">6 kg × ₱35 Wash-Dry-Fold</span>
                <span className="font-medium">₱210.00</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Fabcon + Folding</span>
                <span className="font-medium">₱40.00</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Paid (GCash)</span>
                <span className="font-medium">−₱100.00</span>
              </div>
              <div className="flex justify-between border-t border-slate-100 pt-2.5 text-base">
                <span className="font-bold">Balance</span>
                <span className="font-extrabold text-accent-600">₱150.00</span>
              </div>
            </div>
            <div className="mt-5 flex items-center gap-3 rounded-xl bg-brand-50 p-3">
              <WashingMachine className="text-brand-600" size={20} />
              <p className="text-sm text-brand-800">
                Running in <span className="font-bold">W-02</span> · ready by 5:30 PM
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="bg-white py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <h2 className="text-center text-3xl font-extrabold tracking-tight text-slate-900">More than a list of orders</h2>
          <p className="mx-auto mt-3 max-w-2xl text-center text-slate-600">
            The system computes prices, balances, deadlines, and availability so staff can focus on the laundry.
          </p>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map(({ icon: Icon, title, text }) => (
              <div key={title} className="rounded-card border border-slate-100 p-6">
                <span className="grid size-11 place-items-center rounded-xl bg-brand-50 text-brand-600">
                  <Icon size={22} />
                </span>
                <h3 className="mt-4 font-bold text-slate-900">{title}</h3>
                <p className="mt-2 text-sm text-slate-600">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <h2 className="text-center text-3xl font-extrabold tracking-tight text-slate-900">How it works</h2>
        <ol className="mt-12 grid gap-6 md:grid-cols-3">
          {steps.map((s, i) => (
            <li key={s.title} className="rounded-card bg-white p-6 shadow-card">
              <span className="grid size-10 place-items-center rounded-full bg-accent-500 font-extrabold text-white">{i + 1}</span>
              <h3 className="mt-4 font-bold text-slate-900">{s.title}</h3>
              <p className="mt-2 text-sm text-slate-600">{s.text}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* CTA */}
      <section className="px-4 pb-20 sm:px-6">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-6 rounded-card bg-brand-900 px-6 py-12 text-center sm:px-12">
          <Shirt className="text-brand-300" size={36} />
          <h2 className="text-2xl font-extrabold text-white sm:text-3xl">Dropped off your laundry?</h2>
          <p className="max-w-md text-brand-100">Check its status and balance anytime with the code on your claim slip.</p>
          <LinkButton to="/track" variant="secondary" className="px-6 py-3 text-base">
            Track my laundry
          </LinkButton>
        </div>
      </section>

      <footer className="border-t border-slate-200 py-8 text-center text-sm text-slate-500">
        © {new Date().getFullYear()} Laundry System · CTADWEBL Final Project
      </footer>
    </div>
  )
}
