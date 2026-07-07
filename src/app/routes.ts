import { createBrowserRouter } from 'react-router';
import { Layout } from './components/layout/Layout';

import { HomePage } from './pages/HomePage';

export const router = createBrowserRouter([
  {
    path: '/',
    Component: Layout,
    children: [
      { index: true, Component: HomePage },
    ],
  },
]);