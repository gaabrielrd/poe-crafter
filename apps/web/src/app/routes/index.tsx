import { createBrowserRouter, type RouteObject } from 'react-router';
import { App } from '@/app/App';
import { NotFound, RouteErrorFallback } from '@/app/components/RouteErrorFallback';
import { StyleguidePage } from '@/app/styleguide';
import { HomePage } from '@/features/home';
import { ItemImportPage } from '@/features/item-import';
import { CraftPage, HistoryPage } from '@/features/craft-persistence';
import { SettingsPage } from '@/features/account-settings';
import { AdminPage } from '@/features/admin-operations';

/**
 * Definicao das rotas, separada do router para permitir montar a mesma
 * arvore com um router de memoria nos testes.
 */
export const routes: RouteObject[] = [
  {
    path: '/',
    element: <App />,
    // Captura erros do layout e de qualquer rota filha sem errorElement proprio.
    errorElement: <RouteErrorFallback />,
    children: [
      {
        path: 'new',
        element: <ItemImportPage />,
      },
      {
        path: 'history',
        element: <HistoryPage />,
      },
      {
        path: 'craft/:craftId',
        element: <CraftPage />,
      },
      {
        path: 'settings',
        element: <SettingsPage />,
      },
      {
        path: 'admin',
        element: <AdminPage />,
      },
      {
        index: true,
        element: <HomePage />,
      },
      {
        // Referência viva do sistema visual da aplicação.
        path: 'styleguide',
        element: <StyleguidePage />,
      },
      {
        // Qualquer endereco desconhecido cai aqui, dentro do layout.
        path: '*',
        element: <NotFound />,
      },
    ],
  },
];

export const router = createBrowserRouter(routes);
