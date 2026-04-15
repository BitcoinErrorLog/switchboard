import { createBrowserRouter } from 'react-router-dom'
import App from './App'
import Home from './pages/Home'
import Landing from './pages/Landing'
import Import from './pages/Import'
import Preview from './pages/Preview'
import Verify from './pages/Verify'
import Activate from './pages/Activate'
import Done from './pages/Done'
import Accounts from './pages/Accounts'
import Reader from './pages/Reader'
import Compose from './pages/Compose'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      { index: true, element: <Home /> },
      { path: 'accounts', element: <Accounts /> },
      { path: 'reader', element: <Reader /> },
      { path: 'compose', element: <Compose /> },
      { path: ':platform', element: <Landing /> },
      { path: ':platform/import', element: <Import /> },
      { path: ':platform/preview', element: <Preview /> },
      { path: ':platform/verify', element: <Verify /> },
      { path: ':platform/activate', element: <Activate /> },
      { path: ':platform/done', element: <Done /> },
    ],
  },
])
