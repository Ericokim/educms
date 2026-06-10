import { createBrowserRouter } from 'react-router-dom'
import { ROLES, STAFF_ROLES } from '@educms/shared'
import { AnalyticsPage } from '@/features/analytics/AnalyticsPage'
import { LoginPage } from '@/features/auth/LoginPage'
import { ProtectedRoute } from '@/features/auth/ProtectedRoute'
import { RequireRole } from '@/features/auth/RequireRole'
import { CommentsPage } from '@/features/comments/CommentsPage'
import { DashboardPage } from '@/features/dashboard/DashboardPage'
import { MediaPage } from '@/features/media/MediaPage'
import { PostEditorPage } from '@/features/posts/PostEditorPage'
import { PostsPage } from '@/features/posts/PostsPage'
import { CategoriesPage } from '@/features/taxonomy/CategoriesPage'
import { TagsPage } from '@/features/taxonomy/TagsPage'
import { UsersPage } from '@/features/users/UsersPage'
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
                <CommentsPage />
              </RequireRole>
            ),
          },
          {
            path: '/media',
            element: (
              <RequireRole roles={STAFF_ROLES}>
                <MediaPage />
              </RequireRole>
            ),
          },
          {
            path: '/users',
            element: (
              <RequireRole roles={[ROLES.ADMIN]}>
                <UsersPage />
              </RequireRole>
            ),
          },
          {
            path: '/analytics',
            element: (
              <RequireRole roles={[ROLES.ADMIN, ROLES.EDITOR]}>
                <AnalyticsPage />
              </RequireRole>
            ),
          },
        ],
      },
    ],
  },
])
