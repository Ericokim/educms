import { lazy } from 'react'
import { createBrowserRouter } from 'react-router-dom'
import { ROLES, STAFF_ROLES } from '@educms/shared'
import { LoginPage } from '@/features/auth/LoginPage'
import { ProtectedRoute } from '@/features/auth/ProtectedRoute'
import { RequireRole } from '@/features/auth/RequireRole'
import { DashboardPage } from '@/features/dashboard/DashboardPage'
import { AppLayout } from './layout/AppLayout'

// Heavy feature pages are split into their own chunks; the post editor
// (TipTap) and analytics (recharts) carry the largest dependencies.
const PostsPage = lazy(() =>
  import('@/features/posts/PostsPage').then((m) => ({ default: m.PostsPage }))
)
const PostEditorPage = lazy(() =>
  import('@/features/posts/PostEditorPage').then((m) => ({ default: m.PostEditorPage }))
)
const CategoriesPage = lazy(() =>
  import('@/features/taxonomy/CategoriesPage').then((m) => ({ default: m.CategoriesPage }))
)
const TagsPage = lazy(() =>
  import('@/features/taxonomy/TagsPage').then((m) => ({ default: m.TagsPage }))
)
const CommentsPage = lazy(() =>
  import('@/features/comments/CommentsPage').then((m) => ({ default: m.CommentsPage }))
)
const MediaPage = lazy(() =>
  import('@/features/media/MediaPage').then((m) => ({ default: m.MediaPage }))
)
const UsersPage = lazy(() =>
  import('@/features/users/UsersPage').then((m) => ({ default: m.UsersPage }))
)
const AnalyticsPage = lazy(() =>
  import('@/features/analytics/AnalyticsPage').then((m) => ({ default: m.AnalyticsPage }))
)

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
