import { lazy } from 'react'
import { createBrowserRouter, Navigate } from 'react-router-dom'
import { ROLES, STAFF_ROLES } from '@educms/shared'
import { LoginPage } from '@/features/auth/LoginPage'
import { ProtectedRoute } from '@/features/auth/ProtectedRoute'
import { RequireRole } from '@/features/auth/RequireRole'
import { DashboardPage } from '@/features/dashboard/DashboardPage'
import { PublicLayout } from '@/features/public/components/PublicLayout'
import { HomePage } from '@/features/public/pages/HomePage'
import { AppLayout } from './layout/AppLayout'

// Heavy feature pages are split into their own chunks; the post editor
// (TipTap) and analytics (recharts) carry the largest dependencies.
const PostsPage = lazy(() =>
  import('@/features/posts/PostsPage').then((m) => ({ default: m.PostsPage }))
)
const PostEditorPage = lazy(() =>
  import('@/features/posts/PostEditorPage').then((m) => ({ default: m.PostEditorPage }))
)
const PostPreviewPage = lazy(() =>
  import('@/features/posts/PostPreviewPage').then((m) => ({ default: m.PostPreviewPage }))
)
const CategoriesAdminPage = lazy(() =>
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

// Public reading experience.
const ArticlesPage = lazy(() =>
  import('@/features/public/pages/ArticlesPage').then((m) => ({ default: m.ArticlesPage }))
)
const ArticleDetailPage = lazy(() =>
  import('@/features/public/pages/ArticleDetailPage').then((m) => ({
    default: m.ArticleDetailPage,
  }))
)
const PublicCategoriesPage = lazy(() =>
  import('@/features/public/pages/CategoriesPage').then((m) => ({
    default: m.CategoriesPage,
  }))
)
const CategoryDetailPage = lazy(() =>
  import('@/features/public/pages/CategoryDetailPage').then((m) => ({
    default: m.CategoryDetailPage,
  }))
)
const TagDetailPage = lazy(() =>
  import('@/features/public/pages/TagDetailPage').then((m) => ({
    default: m.TagDetailPage,
  }))
)
const SearchPage = lazy(() =>
  import('@/features/public/pages/SearchPage').then((m) => ({ default: m.SearchPage }))
)

export const router = createBrowserRouter([
  {
    element: <PublicLayout />,
    children: [
      { path: '/', element: <HomePage /> },
      { path: '/articles', element: <ArticlesPage /> },
      { path: '/articles/:slug', element: <ArticleDetailPage /> },
      { path: '/categories', element: <PublicCategoriesPage /> },
      { path: '/categories/:slug', element: <CategoryDetailPage /> },
      { path: '/tags/:slug', element: <TagDetailPage /> },
      { path: '/search', element: <SearchPage /> },
    ],
  },
  { path: '/login', element: <LoginPage /> },
  {
    path: '/admin',
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { index: true, element: <DashboardPage /> },
          {
            path: 'posts',
            element: (
              <RequireRole roles={STAFF_ROLES}>
                <PostsPage />
              </RequireRole>
            ),
          },
          {
            path: 'posts/new',
            element: (
              <RequireRole roles={STAFF_ROLES}>
                <PostEditorPage />
              </RequireRole>
            ),
          },
          {
            path: 'posts/:id/edit',
            element: (
              <RequireRole roles={STAFF_ROLES}>
                <PostEditorPage />
              </RequireRole>
            ),
          },
          {
            path: 'posts/:id/preview',
            element: (
              <RequireRole roles={STAFF_ROLES}>
                <PostPreviewPage />
              </RequireRole>
            ),
          },
          {
            path: 'categories',
            element: (
              <RequireRole roles={[ROLES.ADMIN]}>
                <CategoriesAdminPage />
              </RequireRole>
            ),
          },
          {
            path: 'tags',
            element: (
              <RequireRole roles={[ROLES.ADMIN]}>
                <TagsPage />
              </RequireRole>
            ),
          },
          {
            path: 'comments',
            element: (
              <RequireRole roles={[ROLES.ADMIN, ROLES.EDITOR]}>
                <CommentsPage />
              </RequireRole>
            ),
          },
          {
            path: 'media',
            element: (
              <RequireRole roles={STAFF_ROLES}>
                <MediaPage />
              </RequireRole>
            ),
          },
          {
            path: 'users',
            element: (
              <RequireRole roles={[ROLES.ADMIN]}>
                <UsersPage />
              </RequireRole>
            ),
          },
          {
            path: 'analytics',
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
  { path: '*', element: <Navigate to="/" replace /> },
])
