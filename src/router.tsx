import { createBrowserRouter } from 'react-router-dom'
import App from './App'
import Home from './pages/Home'
import Landing from './pages/Landing'
import Import from './pages/Import'
import Preview from './pages/Preview'
import Verify from './pages/Verify'
import Activate from './pages/Activate'
import Done from './pages/Done'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      { index: true, element: <Home /> },
      { path: ':platform', element: <Landing /> },
      { path: ':platform/import', element: <Import /> },
      { path: ':platform/preview', element: <Preview /> },
      { path: ':platform/verify', element: <Verify /> },
      { path: ':platform/activate', element: <Activate /> },
      { path: ':platform/done', element: <Done /> },
    ],
  },
])
