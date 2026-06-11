/**
 * OpenAPI 3.1 specification for the EduCMS API, served at /api/openapi.json
 * and rendered by Scalar at /api/docs.
 *
 * Every path below corresponds to a real route in src/routes/. When routes
 * change, update this document in the same change (see the scalar-api-docs
 * skill).
 */

type Schema = Record<string, unknown>

const ref = (name: string) => ({ $ref: `#/components/schemas/${name}` })

/** Standard success envelope around a payload schema. */
const envelope = (data: Schema): Schema => ({
  type: 'object',
  required: ['success', 'message', 'data'],
  properties: {
    success: { type: 'boolean', const: true },
    message: { type: 'string' },
    data,
  },
})

const paginated = (items: Schema): Schema =>
  envelope({
    type: 'object',
    properties: {
      items: { type: 'array', items },
      pagination: ref('PaginationMeta'),
    },
  })

const jsonResponse = (description: string, schema: Schema) => ({
  description,
  content: { 'application/json': { schema } },
})

const errorResponse = (description: string) =>
  jsonResponse(description, ref('ApiErrorResponse'))

/** Common error responses keyed by status code. */
const errors = (...codes: number[]) => {
  const map: Record<number, { description: string }> = {
    400: { description: 'Bad request (e.g. invalid reference or malformed body)' },
    401: { description: 'Authentication required or token invalid/expired' },
    403: { description: 'Authenticated but not permitted (role or ownership)' },
    404: { description: 'Resource not found' },
    409: { description: 'Conflict (duplicate name, slug, email, or username)' },
    413: { description: 'File too large' },
    422: { description: 'Validation failed (includes per-field errors)' },
    429: { description: 'Rate limit exceeded' },
  }
  return Object.fromEntries(
    codes.map((code) => [String(code), errorResponse(map[code].description)])
  )
}

const bearer = [{ bearerAuth: [] }]

const idParam = {
  name: 'id',
  in: 'path',
  required: true,
  schema: { type: 'integer', minimum: 1 },
}

const slugParam = {
  name: 'slug',
  in: 'path',
  required: true,
  schema: { type: 'string' },
}

const pageParams = [
  { name: 'page', in: 'query', schema: { type: 'integer', minimum: 1, default: 1 } },
  { name: 'limit', in: 'query', schema: { type: 'integer', minimum: 1, default: 10 } },
]

export const openApiDocument = {
  openapi: '3.1.0',
  info: {
    title: 'EduCMS API',
    version: '1.0.0',
    description: [
      'REST API for EduCMS, an educational content management system with JWT',
      'authentication, role-based access control (admin > editor > author >',
      'subscriber), content publishing with versioning, comment moderation,',
      'media uploads, analytics, and a public content namespace.',
      '',
      '**Testing protected endpoints:** run `POST /auth/login` (demo seed user:',
      '`admin@educms.local` / `Password123!`), copy `data.token` from the',
      'response, then set it as the Bearer token in the auth panel.',
      '',
      '**Envelope:** every response is `{ success, message, data }` on success',
      'or `{ success, message, errors }` on failure.',
      '',
      '**Rate limits** (per IP, 15-minute windows): 300 general, 20 login,',
      '30 comment submissions, 60 uploads.',
    ].join('\n'),
  },
  servers: [
    { url: 'http://localhost:4000/api', description: 'Local development' },
    { url: 'https://educms-api.onrender.com/api', description: 'Production (Render)' },
  ],
  tags: [
    { name: 'Health', description: 'Service and database status (public)' },
    { name: 'Auth', description: 'Login, current user, logout' },
    { name: 'Public Content', description: 'Published content for the public site — no auth required to read' },
    { name: 'Posts', description: 'Content management (staff; authors limited to their own posts)' },
    { name: 'Categories', description: 'Category management (list: staff; mutations: admin)' },
    { name: 'Tags', description: 'Tag management (list: staff; mutations: admin)' },
    { name: 'Comments', description: 'Moderation (admin/editor) and submission (any authenticated user)' },
    { name: 'Media', description: 'Upload library (staff; authors limited to their own files)' },
    { name: 'Users', description: 'Account management (admin only)' },
    { name: 'Analytics', description: 'Dashboard (staff) and detailed analytics (admin/editor)' },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'JWT from POST /auth/login. Example header: `Authorization: Bearer <token>`',
      },
    },
    schemas: {
      ApiErrorResponse: {
        type: 'object',
        required: ['success', 'message', 'errors'],
        properties: {
          success: { type: 'boolean', const: false },
          message: { type: 'string', examples: ['Validation failed'] },
          errors: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                field: { type: 'string', examples: ['title'] },
                message: { type: 'string', examples: ['Title must be at least 3 characters'] },
              },
            },
          },
        },
      },
      PaginationMeta: {
        type: 'object',
        properties: {
          page: { type: 'integer', examples: [1] },
          limit: { type: 'integer', examples: [10] },
          total: { type: 'integer', examples: [42] },
          totalPages: { type: 'integer', examples: [5] },
        },
      },
      LoginRequest: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email', examples: ['admin@educms.local'] },
          password: { type: 'string', examples: ['Password123!'] },
        },
      },
      User: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          username: { type: 'string', examples: ['admin'] },
          email: { type: 'string', format: 'email' },
          firstName: { type: ['string', 'null'] },
          lastName: { type: ['string', 'null'] },
          role: { type: 'string', enum: ['admin', 'editor', 'author', 'subscriber'] },
          isActive: { type: 'boolean' },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
      CreateUserRequest: {
        type: 'object',
        required: ['username', 'email', 'password', 'role'],
        properties: {
          username: { type: 'string', minLength: 3, maxLength: 50 },
          email: { type: 'string', format: 'email' },
          password: { type: 'string', minLength: 8 },
          firstName: { type: 'string' },
          lastName: { type: 'string' },
          role: { type: 'string', enum: ['admin', 'editor', 'author', 'subscriber'] },
        },
      },
      UpdateUserRequest: {
        type: 'object',
        required: ['username', 'email'],
        properties: {
          username: { type: 'string', minLength: 3, maxLength: 50 },
          email: { type: 'string', format: 'email' },
          password: { type: 'string', description: 'Omit or empty to keep the current password' },
          firstName: { type: 'string' },
          lastName: { type: 'string' },
        },
      },
      TagSummary: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          name: { type: 'string', examples: ['Programming'] },
          slug: { type: 'string', examples: ['programming'] },
        },
      },
      Post: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          title: { type: 'string' },
          slug: { type: 'string' },
          status: { type: 'string', enum: ['draft', 'published', 'archived'] },
          excerpt: { type: ['string', 'null'] },
          content: { type: 'string', description: 'HTML from the rich text editor' },
          authorId: { type: 'integer' },
          author: { type: 'string' },
          categoryId: { type: ['integer', 'null'] },
          categoryName: { type: ['string', 'null'] },
          tags: { type: 'array', items: ref('TagSummary') },
          featuredImageId: { type: ['integer', 'null'] },
          featuredImageUrl: { type: ['string', 'null'] },
          metaTitle: { type: ['string', 'null'] },
          metaDescription: { type: ['string', 'null'] },
          metaKeywords: { type: ['string', 'null'] },
          viewCount: { type: 'integer' },
          publishedAt: { type: ['string', 'null'], format: 'date-time' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      PostFormRequest: {
        type: 'object',
        required: ['title', 'content'],
        properties: {
          title: { type: 'string', minLength: 3, maxLength: 255 },
          slug: { type: 'string', description: 'Optional; generated from the title when omitted. Duplicate explicit slugs return 409.' },
          excerpt: { type: 'string', maxLength: 500 },
          content: { type: 'string', minLength: 1 },
          categoryId: { type: ['integer', 'null'] },
          featuredImageId: { type: ['integer', 'null'] },
          tagIds: { type: 'array', items: { type: 'integer' }, default: [] },
          metaTitle: { type: 'string', maxLength: 255 },
          metaDescription: { type: 'string', maxLength: 500 },
          metaKeywords: { type: 'string', maxLength: 255 },
        },
      },
      PostVersion: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          versionNumber: { type: 'integer' },
          title: { type: 'string' },
          status: { type: 'string', enum: ['draft', 'published', 'archived'] },
          createdBy: { type: ['string', 'null'] },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
      Category: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          name: { type: 'string', examples: ['Tutorials'] },
          slug: { type: 'string', examples: ['tutorials'] },
          description: { type: ['string', 'null'] },
          postCount: { type: 'integer' },
        },
      },
      CategoryFormRequest: {
        type: 'object',
        required: ['name'],
        properties: {
          name: { type: 'string', minLength: 2, maxLength: 100 },
          slug: { type: 'string', description: 'Optional; generated from the name when omitted' },
          description: { type: 'string', maxLength: 500 },
        },
      },
      Tag: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          name: { type: 'string' },
          slug: { type: 'string' },
          postCount: { type: 'integer' },
        },
      },
      TagFormRequest: {
        type: 'object',
        required: ['name'],
        properties: {
          name: { type: 'string', minLength: 2, maxLength: 50 },
          slug: { type: 'string' },
        },
      },
      Comment: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          postId: { type: 'integer' },
          postTitle: { type: 'string' },
          author: { type: 'string' },
          content: { type: 'string' },
          status: { type: 'string', enum: ['pending', 'approved', 'spam', 'trash'] },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
      Media: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          filename: { type: 'string', description: 'Random UUID name on disk' },
          originalName: { type: 'string' },
          mimeType: { type: 'string', enum: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'] },
          sizeBytes: { type: 'integer' },
          url: { type: 'string', examples: ['/uploads/9b2f….png'], description: 'Served from the API origin without the /api prefix' },
          altText: { type: ['string', 'null'] },
          caption: { type: ['string', 'null'] },
          uploadedById: { type: ['integer', 'null'] },
          uploadedBy: { type: ['string', 'null'] },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
      PublicPostSummary: {
        type: 'object',
        description: 'Public-safe shape: no status or internal ids beyond the post id',
        properties: {
          id: { type: 'integer' },
          title: { type: 'string' },
          slug: { type: 'string' },
          excerpt: { type: ['string', 'null'] },
          author: { type: 'string', description: 'Display name' },
          categoryName: { type: ['string', 'null'] },
          categorySlug: { type: ['string', 'null'] },
          tags: { type: 'array', items: ref('TagSummary') },
          featuredImageUrl: { type: ['string', 'null'] },
          publishedAt: { type: 'string', format: 'date-time' },
          viewCount: { type: 'integer' },
          readingMinutes: { type: 'integer' },
        },
      },
      PublicPostDetail: {
        allOf: [
          ref('PublicPostSummary'),
          {
            type: 'object',
            properties: {
              content: { type: 'string' },
              metaTitle: { type: ['string', 'null'] },
              metaDescription: { type: ['string', 'null'] },
              metaKeywords: { type: ['string', 'null'] },
              related: { type: 'array', items: ref('PublicPostSummary'), maxItems: 3 },
            },
          },
        ],
      },
      PublicComment: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          author: { type: 'string' },
          content: { type: 'string' },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
      DashboardAnalytics: {
        type: 'object',
        properties: {
          stats: {
            type: 'object',
            properties: {
              publishedPosts: { type: 'integer' },
              draftPosts: { type: 'integer' },
              archivedPosts: { type: 'integer' },
              totalViews: { type: 'integer' },
              pendingComments: { type: 'integer' },
              activeUsers: { type: 'integer' },
              mediaCount: { type: 'integer' },
              categoriesCount: { type: 'integer' },
              tagsCount: { type: 'integer' },
            },
          },
          recentPosts: { type: 'array', items: { type: 'object' } },
          pendingComments: { type: 'array', items: { type: 'object' } },
          recentActivity: { type: 'array', items: { type: 'object' } },
        },
      },
    },
  },
  paths: {
    // ----- Health -----
    '/health': {
      get: {
        tags: ['Health'],
        summary: 'API health',
        description: 'Public endpoint. No authentication required.',
        responses: {
          200: jsonResponse('Service is healthy', envelope({
            type: 'object',
            properties: {
              status: { type: 'string', examples: ['ok'] },
              environment: { type: 'string' },
              uptime: { type: 'number' },
              timestamp: { type: 'string', format: 'date-time' },
            },
          })),
        },
      },
    },
    '/health/db': {
      get: {
        tags: ['Health'],
        summary: 'Database connectivity',
        description: 'Public endpoint. Returns 503 when the database is unreachable.',
        responses: {
          200: jsonResponse('Database reachable', envelope({ type: 'object', properties: { database: { type: 'string', examples: ['connected'] } } })),
          503: errorResponse('Database unreachable'),
        },
      },
    },

    // ----- Auth -----
    '/auth/login': {
      post: {
        tags: ['Auth'],
        summary: 'Log in',
        description: 'Public endpoint. Rate limited to 20 attempts per 15 minutes per IP. Returns the same 401 for unknown email, wrong password, and deactivated accounts.',
        requestBody: { required: true, content: { 'application/json': { schema: ref('LoginRequest') } } },
        responses: {
          200: jsonResponse('Logged in', envelope({
            type: 'object',
            properties: { token: { type: 'string', examples: ['<jwt>'] }, user: ref('User') },
          })),
          ...errors(401, 422, 429),
        },
      },
    },
    '/auth/me': {
      get: {
        tags: ['Auth'],
        summary: 'Current user',
        description: 'Requires any authenticated user. The user is reloaded from the database on every request, so deactivation and role changes apply immediately.',
        security: bearer,
        responses: {
          200: jsonResponse('Authenticated user', envelope({ type: 'object', properties: { user: ref('User') } })),
          ...errors(401),
        },
      },
    },
    '/auth/logout': {
      post: {
        tags: ['Auth'],
        summary: 'Log out',
        description: 'Requires any authenticated user. JWTs are stateless; the client discards the token.',
        security: bearer,
        responses: { 200: jsonResponse('Logged out', envelope({ type: 'null' })), ...errors(401) },
      },
    },

    // ----- Public content -----
    '/public/posts': {
      get: {
        tags: ['Public Content'],
        summary: 'List published posts',
        description: 'Public endpoint. Only published posts are ever returned.',
        parameters: [
          ...pageParams,
          { name: 'categorySlug', in: 'query', schema: { type: 'string' } },
          { name: 'tagSlug', in: 'query', schema: { type: 'string' } },
          { name: 'search', in: 'query', schema: { type: 'string' } },
          { name: 'sort', in: 'query', schema: { type: 'string', enum: ['latest', 'popular'], default: 'latest' } },
        ],
        responses: { 200: jsonResponse('Published posts', paginated(ref('PublicPostSummary'))), ...errors(422) },
      },
    },
    '/public/posts/{slug}': {
      get: {
        tags: ['Public Content'],
        summary: 'Published article by slug',
        description: 'Public endpoint. Returns 404 for drafts and archived posts. Includes up to 3 related published posts.',
        parameters: [slugParam],
        responses: { 200: jsonResponse('Article', envelope(ref('PublicPostDetail'))), ...errors(404) },
      },
    },
    '/public/categories': {
      get: {
        tags: ['Public Content'],
        summary: 'Categories with published post counts',
        description: 'Public endpoint.',
        responses: { 200: jsonResponse('Categories', envelope({ type: 'array', items: ref('Category') })) },
      },
    },
    '/public/categories/{slug}/posts': {
      get: {
        tags: ['Public Content'],
        summary: 'Published posts in a category',
        description: 'Public endpoint.',
        parameters: [slugParam, ...pageParams],
        responses: { 200: jsonResponse('Published posts', paginated(ref('PublicPostSummary'))), ...errors(422) },
      },
    },
    '/public/tags/{slug}/posts': {
      get: {
        tags: ['Public Content'],
        summary: 'Published posts with a tag',
        description: 'Public endpoint.',
        parameters: [slugParam, ...pageParams],
        responses: { 200: jsonResponse('Published posts', paginated(ref('PublicPostSummary'))), ...errors(422) },
      },
    },
    '/public/search': {
      get: {
        tags: ['Public Content'],
        summary: 'Search published content',
        description: 'Public endpoint. Searches title, excerpt, and content of published posts.',
        parameters: [
          { name: 'q', in: 'query', required: true, schema: { type: 'string', minLength: 2 } },
          ...pageParams,
        ],
        responses: { 200: jsonResponse('Search results', paginated(ref('PublicPostSummary'))), ...errors(422) },
      },
    },
    '/public/posts/{slug}/comments': {
      get: {
        tags: ['Public Content'],
        summary: 'Approved comments on an article',
        description: 'Public endpoint. Only approved comments are returned.',
        parameters: [slugParam],
        responses: { 200: jsonResponse('Comments', envelope({ type: 'array', items: ref('PublicComment') })), ...errors(404) },
      },
      post: {
        tags: ['Public Content'],
        summary: 'Submit a comment',
        description: 'Requires any authenticated user (including subscribers). The comment is created as **pending** and appears publicly only after moderation. Rate limited to 30 per 15 minutes.',
        security: bearer,
        parameters: [slugParam],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { type: 'object', required: ['content'], properties: { content: { type: 'string', minLength: 2, maxLength: 2000 } } } } },
        },
        responses: { 201: jsonResponse('Submitted for review', envelope({ type: 'null' })), ...errors(401, 404, 422, 429) },
      },
    },
    '/public/posts/{slug}/view': {
      post: {
        tags: ['Public Content'],
        summary: 'Record a view',
        description: 'Public endpoint. Increments the view counter for a published article; 404 otherwise.',
        parameters: [slugParam],
        responses: { 200: jsonResponse('View recorded', envelope({ type: 'null' })), ...errors(404) },
      },
    },

    // ----- Posts (staff) -----
    '/posts': {
      get: {
        tags: ['Posts'],
        summary: 'List posts',
        description: 'Requires staff (admin, editor, or author). **Authors only see their own posts.**',
        security: bearer,
        parameters: [
          ...pageParams,
          { name: 'status', in: 'query', schema: { type: 'string', enum: ['draft', 'published', 'archived'] } },
          { name: 'categoryId', in: 'query', schema: { type: 'integer' } },
          { name: 'tagId', in: 'query', schema: { type: 'integer' } },
          { name: 'search', in: 'query', schema: { type: 'string' } },
        ],
        responses: { 200: jsonResponse('Posts', paginated(ref('Post'))), ...errors(401, 403, 422) },
      },
      post: {
        tags: ['Posts'],
        summary: 'Create a draft',
        description: 'Requires staff. The post is created as a draft owned by the caller; version 1 is snapshotted.',
        security: bearer,
        requestBody: { required: true, content: { 'application/json': { schema: ref('PostFormRequest') } } },
        responses: { 201: jsonResponse('Created', envelope(ref('Post'))), ...errors(400, 401, 403, 409, 422) },
      },
    },
    '/posts/{id}': {
      get: {
        tags: ['Posts'],
        summary: 'Post detail',
        description: 'Requires staff. Authors can only read their own posts.',
        security: bearer,
        parameters: [idParam],
        responses: { 200: jsonResponse('Post', envelope(ref('Post'))), ...errors(401, 403, 404) },
      },
      patch: {
        tags: ['Posts'],
        summary: 'Update a post',
        description: 'Requires staff; authors can only update their own posts. Content/SEO changes create a new version snapshot.',
        security: bearer,
        parameters: [idParam],
        requestBody: { required: true, content: { 'application/json': { schema: ref('PostFormRequest') } } },
        responses: { 200: jsonResponse('Updated', envelope(ref('Post'))), ...errors(400, 401, 403, 404, 409, 422) },
      },
      delete: {
        tags: ['Posts'],
        summary: 'Delete a post',
        description: 'Requires **admin** role. Removes the post and its version history.',
        security: bearer,
        parameters: [idParam],
        responses: { 200: jsonResponse('Deleted', envelope({ type: 'null' })), ...errors(401, 403, 404) },
      },
    },
    '/posts/slug/{slug}': {
      get: {
        tags: ['Posts'],
        summary: 'Published post by slug (authenticated)',
        description: 'Requires any authenticated user. Returns published posts only — prefer /public/posts/{slug} for the public site.',
        security: bearer,
        parameters: [slugParam],
        responses: { 200: jsonResponse('Post', envelope(ref('Post'))), ...errors(401, 404) },
      },
    },
    '/posts/{id}/publish': {
      patch: {
        tags: ['Posts'],
        summary: 'Publish',
        description: 'Requires **admin or editor** role. Sets published_at on first publish.',
        security: bearer,
        parameters: [idParam],
        responses: { 200: jsonResponse('Published', envelope(ref('Post'))), ...errors(401, 403, 404) },
      },
    },
    '/posts/{id}/archive': {
      patch: {
        tags: ['Posts'],
        summary: 'Archive',
        description: 'Requires **admin or editor** role. Archived posts disappear from the public site but stay restorable.',
        security: bearer,
        parameters: [idParam],
        responses: { 200: jsonResponse('Archived', envelope(ref('Post'))), ...errors(401, 403, 404) },
      },
    },
    '/posts/{id}/versions': {
      get: {
        tags: ['Posts'],
        summary: 'Version history',
        description: 'Requires staff; authors can only view their own posts. Newest first.',
        security: bearer,
        parameters: [idParam],
        responses: { 200: jsonResponse('Versions', envelope({ type: 'array', items: ref('PostVersion') })), ...errors(401, 403, 404) },
      },
    },
    '/posts/{id}/rollback/{versionId}': {
      post: {
        tags: ['Posts'],
        summary: 'Roll back to a version',
        description: 'Requires **admin or editor** role. Restores the version content and appends the restored state as a new version (history stays linear).',
        security: bearer,
        parameters: [idParam, { name: 'versionId', in: 'path', required: true, schema: { type: 'integer', minimum: 1 } }],
        responses: { 200: jsonResponse('Rolled back', envelope(ref('Post'))), ...errors(401, 403, 404) },
      },
    },

    // ----- Categories -----
    '/categories': {
      get: {
        tags: ['Categories'],
        summary: 'List categories',
        description: 'Requires staff role.',
        security: bearer,
        responses: { 200: jsonResponse('Categories', envelope({ type: 'array', items: ref('Category') })), ...errors(401, 403) },
      },
      post: {
        tags: ['Categories'],
        summary: 'Create a category',
        description: 'Requires **admin** role. Duplicate names/slugs (case-insensitive) return 409.',
        security: bearer,
        requestBody: { required: true, content: { 'application/json': { schema: ref('CategoryFormRequest') } } },
        responses: { 201: jsonResponse('Created', envelope({ type: 'object', properties: { id: { type: 'integer' } } })), ...errors(401, 403, 409, 422) },
      },
    },
    '/categories/{id}': {
      patch: {
        tags: ['Categories'],
        summary: 'Update a category',
        description: 'Requires **admin** role.',
        security: bearer,
        parameters: [idParam],
        requestBody: { required: true, content: { 'application/json': { schema: ref('CategoryFormRequest') } } },
        responses: { 200: jsonResponse('Updated', envelope({ type: 'null' })), ...errors(401, 403, 404, 409, 422) },
      },
      delete: {
        tags: ['Categories'],
        summary: 'Delete a category',
        description: 'Requires **admin** role. Posts in the category are kept and become uncategorized.',
        security: bearer,
        parameters: [idParam],
        responses: { 200: jsonResponse('Deleted', envelope({ type: 'null' })), ...errors(401, 403, 404) },
      },
    },

    // ----- Tags -----
    '/tags': {
      get: {
        tags: ['Tags'],
        summary: 'List tags',
        description: 'Requires staff role.',
        security: bearer,
        responses: { 200: jsonResponse('Tags', envelope({ type: 'array', items: ref('Tag') })), ...errors(401, 403) },
      },
      post: {
        tags: ['Tags'],
        summary: 'Create a tag',
        description: 'Requires **admin** role.',
        security: bearer,
        requestBody: { required: true, content: { 'application/json': { schema: ref('TagFormRequest') } } },
        responses: { 201: jsonResponse('Created', envelope({ type: 'object', properties: { id: { type: 'integer' } } })), ...errors(401, 403, 409, 422) },
      },
    },
    '/tags/{id}': {
      patch: {
        tags: ['Tags'],
        summary: 'Update a tag',
        description: 'Requires **admin** role.',
        security: bearer,
        parameters: [idParam],
        requestBody: { required: true, content: { 'application/json': { schema: ref('TagFormRequest') } } },
        responses: { 200: jsonResponse('Updated', envelope({ type: 'null' })), ...errors(401, 403, 404, 409, 422) },
      },
      delete: {
        tags: ['Tags'],
        summary: 'Delete a tag',
        description: 'Requires **admin** role. Only the post-tag links are removed; posts are untouched.',
        security: bearer,
        parameters: [idParam],
        responses: { 200: jsonResponse('Deleted', envelope({ type: 'null' })), ...errors(401, 403, 404) },
      },
    },

    // ----- Comments -----
    '/comments': {
      get: {
        tags: ['Comments'],
        summary: 'List comments for moderation',
        description: 'Requires **admin or editor** role.',
        security: bearer,
        parameters: [
          ...pageParams,
          { name: 'status', in: 'query', schema: { type: 'string', enum: ['pending', 'approved', 'spam', 'trash'] } },
        ],
        responses: { 200: jsonResponse('Comments', paginated(ref('Comment'))), ...errors(401, 403, 422) },
      },
      post: {
        tags: ['Comments'],
        summary: 'Create a comment',
        description: 'Requires any authenticated user. Only allowed on **published** posts; lands as pending. Rate limited to 30 per 15 minutes.',
        security: bearer,
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { type: 'object', required: ['postId', 'content'], properties: { postId: { type: 'integer' }, content: { type: 'string', minLength: 2, maxLength: 2000 } } } } },
        },
        responses: { 201: jsonResponse('Submitted for review', envelope(ref('Comment'))), ...errors(400, 401, 404, 422, 429) },
      },
    },
    '/comments/{id}/approve': {
      patch: {
        tags: ['Comments'],
        summary: 'Approve a comment',
        description: 'Requires **admin or editor** role. Also restores comments from spam or trash.',
        security: bearer,
        parameters: [idParam],
        responses: { 200: jsonResponse('Approved', envelope(ref('Comment'))), ...errors(401, 403, 404) },
      },
    },
    '/comments/{id}/spam': {
      patch: {
        tags: ['Comments'],
        summary: 'Mark as spam',
        description: 'Requires **admin or editor** role.',
        security: bearer,
        parameters: [idParam],
        responses: { 200: jsonResponse('Marked as spam', envelope(ref('Comment'))), ...errors(401, 403, 404) },
      },
    },
    '/comments/{id}/trash': {
      patch: {
        tags: ['Comments'],
        summary: 'Move to trash',
        description: 'Requires **admin or editor** role. Reversible via approve.',
        security: bearer,
        parameters: [idParam],
        responses: { 200: jsonResponse('Trashed', envelope(ref('Comment'))), ...errors(401, 403, 404) },
      },
    },

    // ----- Media -----
    '/media': {
      get: {
        tags: ['Media'],
        summary: 'List media',
        description: 'Requires staff role. Newest first.',
        security: bearer,
        parameters: pageParams,
        responses: { 200: jsonResponse('Media', paginated(ref('Media'))), ...errors(401, 403, 422) },
      },
    },
    '/media/upload': {
      post: {
        tags: ['Media'],
        summary: 'Upload a file',
        description: 'Requires staff role. Multipart upload in a `file` field. Allowed: JPEG, PNG, GIF, WebP, PDF up to 5 MB; file content is verified against the declared type (magic bytes). Rate limited to 60 per 15 minutes.',
        security: bearer,
        requestBody: {
          required: true,
          content: {
            'multipart/form-data': {
              schema: { type: 'object', required: ['file'], properties: { file: { type: 'string', format: 'binary' } } },
            },
          },
        },
        responses: { 201: jsonResponse('Uploaded', envelope(ref('Media'))), ...errors(400, 401, 403, 413, 429) },
      },
    },
    '/media/{id}': {
      patch: {
        tags: ['Media'],
        summary: 'Update alt text / caption',
        description: 'Requires staff role; authors can only edit files they uploaded.',
        security: bearer,
        parameters: [idParam],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { type: 'object', properties: { altText: { type: 'string', maxLength: 255 }, caption: { type: 'string', maxLength: 500 } } } } },
        },
        responses: { 200: jsonResponse('Updated', envelope(ref('Media'))), ...errors(401, 403, 404, 422) },
      },
      delete: {
        tags: ['Media'],
        summary: 'Delete a file',
        description: 'Requires staff role; authors can only delete files they uploaded. Posts using the file as a featured image keep working (reference is cleared).',
        security: bearer,
        parameters: [idParam],
        responses: { 200: jsonResponse('Deleted', envelope({ type: 'null' })), ...errors(401, 403, 404) },
      },
    },

    // ----- Users -----
    '/users': {
      get: {
        tags: ['Users'],
        summary: 'List users',
        description: 'Requires **admin** role.',
        security: bearer,
        parameters: [
          ...pageParams,
          { name: 'role', in: 'query', schema: { type: 'string', enum: ['admin', 'editor', 'author', 'subscriber'] } },
          { name: 'search', in: 'query', schema: { type: 'string' } },
        ],
        responses: { 200: jsonResponse('Users', paginated(ref('User'))), ...errors(401, 403, 422) },
      },
      post: {
        tags: ['Users'],
        summary: 'Create a user',
        description: 'Requires **admin** role. Duplicate usernames/emails (case-insensitive) return 409.',
        security: bearer,
        requestBody: { required: true, content: { 'application/json': { schema: ref('CreateUserRequest') } } },
        responses: { 201: jsonResponse('Created', envelope(ref('User'))), ...errors(401, 403, 409, 422) },
      },
    },
    '/users/{id}': {
      get: {
        tags: ['Users'],
        summary: 'User detail',
        description: 'Requires **admin** role.',
        security: bearer,
        parameters: [idParam],
        responses: { 200: jsonResponse('User', envelope(ref('User'))), ...errors(401, 403, 404) },
      },
      patch: {
        tags: ['Users'],
        summary: 'Update a user',
        description: 'Requires **admin** role. Empty/omitted password keeps the current one.',
        security: bearer,
        parameters: [idParam],
        requestBody: { required: true, content: { 'application/json': { schema: ref('UpdateUserRequest') } } },
        responses: { 200: jsonResponse('Updated', envelope(ref('User'))), ...errors(401, 403, 404, 409, 422) },
      },
    },
    '/users/{id}/role': {
      patch: {
        tags: ['Users'],
        summary: 'Change a role',
        description: 'Requires **admin** role. Admins cannot change their own role, and the last active administrator cannot be demoted.',
        security: bearer,
        parameters: [idParam],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { type: 'object', required: ['role'], properties: { role: { type: 'string', enum: ['admin', 'editor', 'author', 'subscriber'] } } } } },
        },
        responses: { 200: jsonResponse('Role updated', envelope(ref('User'))), ...errors(400, 401, 403, 404, 422) },
      },
    },
    '/users/{id}/deactivate': {
      patch: {
        tags: ['Users'],
        summary: 'Deactivate a user',
        description: 'Requires **admin** role. Takes effect immediately (existing tokens stop working). Self-deactivation and deactivating the last active admin are blocked.',
        security: bearer,
        parameters: [idParam],
        responses: { 200: jsonResponse('Deactivated', envelope(ref('User'))), ...errors(400, 401, 403, 404) },
      },
    },
    '/users/{id}/activate': {
      patch: {
        tags: ['Users'],
        summary: 'Reactivate a user',
        description: 'Requires **admin** role.',
        security: bearer,
        parameters: [idParam],
        responses: { 200: jsonResponse('Activated', envelope(ref('User'))), ...errors(401, 403, 404) },
      },
    },

    // ----- Analytics -----
    '/analytics/dashboard': {
      get: {
        tags: ['Analytics'],
        summary: 'Dashboard data',
        description: 'Requires staff role (admin, editor, or author).',
        security: bearer,
        responses: { 200: jsonResponse('Dashboard data', envelope(ref('DashboardAnalytics'))), ...errors(401, 403) },
      },
    },
    '/analytics/posts': {
      get: {
        tags: ['Analytics'],
        summary: 'Content analytics',
        description: 'Requires **admin or editor** role. Top content, category performance, posts per month, comments by status.',
        security: bearer,
        responses: { 200: jsonResponse('Post analytics', envelope({ type: 'object' })), ...errors(401, 403) },
      },
    },
    '/analytics/users': {
      get: {
        tags: ['Analytics'],
        summary: 'User analytics',
        description: 'Requires **admin or editor** role. Users by role and author performance.',
        security: bearer,
        responses: { 200: jsonResponse('User analytics', envelope({ type: 'object' })), ...errors(401, 403) },
      },
    },
  },
}
