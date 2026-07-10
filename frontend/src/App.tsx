import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { ThemeProvider } from './context/ThemeContext';
import { AppLayout } from './components/Layout/AppLayout';
import { DashboardPage } from './pages/DashboardPage';
import { ProductSearchPage } from './pages/ProductSearchPage';
import { ProductDetailPage } from './pages/ProductDetailPage';
import { AdminProductsPage } from './pages/Admin/AdminProductsPage';
import { AdminChargesPage } from './pages/Admin/AdminChargesPage';
import { AdminMarginsPage } from './pages/Admin/AdminMarginsPage';
import { AdminImportPage } from './pages/Admin/AdminImportPage';

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: 'var(--toast-bg, #1f2937)',
              color: 'var(--toast-color, #f9fafb)',
            },
          }}
        />
        <Routes>
          <Route element={<AppLayout />}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/products" element={<ProductSearchPage />} />
            <Route path="/products/:id" element={<ProductDetailPage />} />
            <Route path="/admin/products" element={<AdminProductsPage />} />
            <Route path="/admin/charges" element={<AdminChargesPage />} />
            <Route path="/admin/margins" element={<AdminMarginsPage />} />
            <Route path="/admin/import" element={<AdminImportPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}
