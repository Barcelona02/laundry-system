import { useEffect, useState } from 'react'
import api, { getErrorMessage } from './api/axios'

// Pansamantala: tine-test lang kung konektado ang frontend sa backend
function App() {
  const [status, setStatus] = useState('Checking...')

  useEffect(() => {
    api
      .get('/health')
      .then((res) => setStatus(`Connected: ${res.data.status}`))
      .catch((err) => setStatus(`Error: ${getErrorMessage(err)}`))
  }, [])

  return (
    <main className="grid min-h-screen place-items-center p-4">
      <div className="rounded-card bg-white p-8 text-center shadow-card">
        <h1 className="text-2xl font-bold text-brand-700">Laundry System</h1>
        <p className="mt-2 text-slate-600">{status}</p>
      </div>
    </main>
  )
}

export default App
