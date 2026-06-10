import { createBrowserRouter } from 'react-router-dom'
import { ROLES, STAFF_ROLES } from '@educms/shared'
import { ComingSoon } from '@/components/shared/ComingSoon'
import { LoginPage } from '@/features/auth/LoginPage'
import { ProtectedRoute } from '@/features/auth/ProtectedRoute'
import { RequireRole } from '@/features/auth/RequireRole'
import { DashboardPage } from '@/features/dashboard/DashboardPage'
import { PostEditorPage } from '@/features/posts/PostEditorPage'
import { PostsPage } from '@/features/posts/PostsPage'
import { CategoriesPage } from '@/features/taxonomy/CategoriesPage'
import { TagsPage } from '@/features/taxonomy/TagsPage'
import { AppLayout } from './layout/AppLayout'


export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { path: '/', element: <DashboardPage /> },
          {
            path: '/posts',
            element: (
              <RequireRole roles={STAFF_ROLES}>
                <PostsPage />
              </RequireRole>
            ),
          },
          {
            path: '/posts/new',
            element: (
              <RequireRole roles={STAFF_ROLES}>
                <PostEditorPage />
              </RequireRole>
            ),
          },
          {
            path: '/posts/:id/edit',
            element: (
              <RequireRole roles={STAFF_ROLES}>
                <PostEditorPage />
              </RequireRole>
            ),
          },
          {
            path: '/categories',
            element: (
              <RequireRole roles={[ROLES.ADMIN]}>
                <CategoriesPage />
              </RequireRole>
            ),
          },
          {
            path: '/tags',
            element: (
              <RequireRole roles={[ROLES.ADMIN]}>
                <TagsPage />
              </RequireRole>
            ),
          },
          {
            path: '/comments',
            element: (
              <RequireRole roles={[ROLES.ADMIN, ROLES.EDITOR]}>
                <ComingSoon title="Comments" phase="Phase 8" />
              </RequireRole>
            ),
          },
          {
            path: '/media',
            element: (
              <RequireRole roles={STAFF_ROLES}>
                <ComingSoon title="Media" phase="Phase 9" />
              </RequireRole>
            ),
          },
          {
            path: '/users',
            element: (
              <RequireRole roles={[ROLES.ADMIN]}>
                <ComingSoon title="Users" phase="Phase 10" />
              </RequireRole>
            ),
          },
          {
            path: '/analytics',
            element: (
              <RequireRole roles={[ROLES.ADMIN, ROLES.EDITOR]}>
                <ComingSoon title="Analytics" phase="Phase 11" />
              </RequireRole>
            ),
          },
        ],
      },
    ],
  },
])
