import { createBrowserRouter, Navigate } from 'react-router-dom';
import { App } from './App';
import { LoginPage } from '../features/auth/LoginPage';
import { AlbumPage } from '../features/album/AlbumPage';
import { DuplicatesPage } from '../features/duplicates/DuplicatesPage';
import { MissingPage } from '../features/missing/MissingPage';
import { ProfilePage } from '../features/profile/ProfilePage';
import { ScannerPage } from '../features/scanner/ScannerPage';

export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  {
    path: '/',
    element: <App />,
    children: [
      { index: true, element: <Navigate to="/album" replace /> },
      { path: 'album', element: <AlbumPage /> },
      { path: 'faltantes', element: <MissingPage /> },
      { path: 'scanner', element: <ScannerPage /> },
      { path: 'repetidas', element: <DuplicatesPage /> },
      { path: 'perfil', element: <ProfilePage /> }
    ]
  }
]);
