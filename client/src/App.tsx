import { Route, Routes } from 'react-router-dom'
import { AppLayout } from './components/layout/AppLayout'
import { ToastProvider } from './context/ToastProvider'
import CustomerDetail from './pages/CustomerDetail'
import CustomerForm from './pages/CustomerForm'
import CustomersList from './pages/CustomersList'
import Dashboard from './pages/Dashboard'
import Landing from './pages/Landing'
import Machines from './pages/Machines'
import NotFound from './pages/NotFound'
import OrderDetail from './pages/OrderDetail'
import OrderForm from './pages/OrderForm'
import OrdersList from './pages/OrdersList'
import SalesReport from './pages/SalesReport'
import TrackOrder from './pages/TrackOrder'

function App() {
  return (
    <ToastProvider>
      <Routes>
        {/* Public pages (walang sidebar) */}
        <Route path="/" element={<Landing />} />
        <Route path="/track" element={<TrackOrder />} />
        <Route path="/track/:orderCode" element={<TrackOrder />} />

        {/* Admin pages (may sidebar) */}
        <Route element={<AppLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/customers" element={<CustomersList />} />
          <Route path="/customers/new" element={<CustomerForm />} />
          <Route path="/customers/:id" element={<CustomerDetail />} />
          <Route path="/customers/:id/edit" element={<CustomerForm />} />
          <Route path="/orders" element={<OrdersList />} />
          <Route path="/orders/new" element={<OrderForm />} />
          <Route path="/orders/:id" element={<OrderDetail />} />
          <Route path="/orders/:id/edit" element={<OrderForm />} />
          <Route path="/machines" element={<Machines />} />
          <Route path="/sales" element={<SalesReport />} />
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
    </ToastProvider>
  )
}

export default App
