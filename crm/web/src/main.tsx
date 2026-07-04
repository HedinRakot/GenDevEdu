import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import App from './App';
import BoardPage from './pages/BoardPage';
import ParticipantListPage from './pages/ParticipantListPage';
import ParticipantDetailPage from './pages/ParticipantDetailPage';
import ParticipantFormPage from './pages/ParticipantFormPage';
import TemplatePage from './pages/TemplatePage';
import './styles.css';

const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      { index: true, element: <BoardPage /> },
      { path: 'teilnehmer', element: <ParticipantListPage /> },
      { path: 'teilnehmer/neu', element: <ParticipantFormPage /> },
      { path: 'teilnehmer/:id', element: <ParticipantDetailPage /> },
      { path: 'teilnehmer/:id/bearbeiten', element: <ParticipantFormPage /> },
      { path: 'vorlage', element: <TemplatePage /> },
    ],
  },
]);

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 10_000 } },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  </StrictMode>,
);
