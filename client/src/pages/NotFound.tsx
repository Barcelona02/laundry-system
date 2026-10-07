import { LinkButton } from '../components/ui/Button'

// Lumalabas kapag walang route na tumugma sa URL
export default function NotFound() {
  return (
    <main className="grid min-h-screen place-items-center px-4 text-center">
      <div>
        <p className="text-7xl font-extrabold text-brand-200">404</p>
        <h1 className="mt-4 text-2xl font-bold text-slate-900">Page not found</h1>
        <p className="mt-2 text-slate-500">The page you are looking for does not exist or was moved.</p>
        <LinkButton to="/" className="mt-6">
          Back to home
        </LinkButton>
      </div>
    </main>
  )
}
