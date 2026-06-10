/**
 * Initial EduCMS schema: users, categories, tags, media, posts, post_tags,
 * comments, post_versions, activity_log.
 *
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
export const shorthands = undefined;

const timestamps = (pgm) => ({
  created_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
  updated_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
});

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @returns {Promise<void> | void}
 */
export const up = (pgm) => {
  pgm.createTable('users', {
    id: 'id',
    username: { type: 'varchar(50)', notNull: true, unique: true },
    email: { type: 'varchar(255)', notNull: true, unique: true },
    password_hash: { type: 'varchar(255)', notNull: true },
    first_name: { type: 'varchar(100)' },
    last_name: { type: 'varchar(100)' },
    role: {
      type: 'varchar(20)',
      notNull: true,
      default: 'subscriber',
      check: "role IN ('admin', 'editor', 'author', 'subscriber')",
    },
    is_active: { type: 'boolean', notNull: true, default: true },
    ...timestamps(pgm),
  });
  pgm.createIndex('users', 'role');

  pgm.createTable('categories', {
    id: 'id',
    name: { type: 'varchar(100)', notNull: true, unique: true },
    slug: { type: 'varchar(120)', notNull: true, unique: true },
    description: { type: 'text' },
    ...timestamps(pgm),
  });

  pgm.createTable('tags', {
    id: 'id',
    name: { type: 'varchar(50)', notNull: true, unique: true },
    slug: { type: 'varchar(60)', notNull: true, unique: true },
    ...timestamps(pgm),
  });

  pgm.createTable('media', {
    id: 'id',
    filename: { type: 'varchar(255)', notNull: true, unique: true },
    original_name: { type: 'varchar(255)', notNull: true },
    mime_type: { type: 'varchar(100)', notNull: true },
    size_bytes: { type: 'integer', notNull: true },
    path: { type: 'varchar(500)', notNull: true },
    alt_text: { type: 'varchar(255)' },
    caption: { type: 'text' },
    uploaded_by: { type: 'integer', references: 'users', onDelete: 'SET NULL' },
    ...timestamps(pgm),
  });
  pgm.createIndex('media', 'uploaded_by');

  pgm.createTable('posts', {
    id: 'id',
    title: { type: 'varchar(255)', notNull: true },
    slug: { type: 'varchar(280)', notNull: true, unique: true },
    excerpt: { type: 'text' },
    content: { type: 'text', notNull: true, default: '' },
    status: {
      type: 'varchar(20)',
      notNull: true,
      default: 'draft',
      check: "status IN ('draft', 'published', 'archived')",
    },
    author_id: { type: 'integer', notNull: true, references: 'users', onDelete: 'RESTRICT' },
    category_id: { type: 'integer', references: 'categories', onDelete: 'SET NULL' },
    featured_image_id: { type: 'integer', references: 'media', onDelete: 'SET NULL' },
    meta_title: { type: 'varchar(255)' },
    meta_description: { type: 'varchar(500)' },
    meta_keywords: { type: 'varchar(255)' },
    view_count: { type: 'integer', notNull: true, default: 0 },
    published_at: { type: 'timestamptz' },
    ...timestamps(pgm),
  });
  pgm.createIndex('posts', 'status');
  pgm.createIndex('posts', 'author_id');
  pgm.createIndex('posts', 'category_id');
  pgm.createIndex('posts', 'published_at');

  pgm.createTable(
    'post_tags',
    {
      post_id: { type: 'integer', notNull: true, references: 'posts', onDelete: 'CASCADE' },
      tag_id: { type: 'integer', notNull: true, references: 'tags', onDelete: 'CASCADE' },
    },
    { constraints: { primaryKey: ['post_id', 'tag_id'] } }
  );
  pgm.createIndex('post_tags', 'tag_id');

  pgm.createTable('comments', {
    id: 'id',
    post_id: { type: 'integer', notNull: true, references: 'posts', onDelete: 'CASCADE' },
    user_id: { type: 'integer', references: 'users', onDelete: 'SET NULL' },
    content: { type: 'text', notNull: true },
    status: {
      type: 'varchar(20)',
      notNull: true,
      default: 'pending',
      check: "status IN ('pending', 'approved', 'spam', 'trash')",
    },
    ...timestamps(pgm),
  });
  pgm.createIndex('comments', 'post_id');
  pgm.createIndex('comments', 'status');

  pgm.createTable('post_versions', {
    id: 'id',
    post_id: { type: 'integer', notNull: true, references: 'posts', onDelete: 'CASCADE' },
    version_number: { type: 'integer', notNull: true },
    title: { type: 'varchar(255)', notNull: true },
    content: { type: 'text', notNull: true, default: '' },
    excerpt: { type: 'text' },
    meta_title: { type: 'varchar(255)' },
    meta_description: { type: 'varchar(500)' },
    meta_keywords: { type: 'varchar(255)' },
    status: { type: 'varchar(20)', notNull: true },
    created_by: { type: 'integer', references: 'users', onDelete: 'SET NULL' },
    created_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
  });
  pgm.addConstraint('post_versions', 'post_versions_post_id_version_number_unique', {
    unique: ['post_id', 'version_number'],
  });

  pgm.createTable('activity_log', {
    id: 'id',
    user_id: { type: 'integer', references: 'users', onDelete: 'SET NULL' },
    action: { type: 'varchar(100)', notNull: true },
    entity_type: { type: 'varchar(50)' },
    entity_id: { type: 'integer' },
    details: { type: 'jsonb' },
    created_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
  });
  pgm.createIndex('activity_log', 'user_id');
  pgm.createIndex('activity_log', 'created_at');
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @returns {Promise<void> | void}
 */
export const down = (pgm) => {
  pgm.dropTable('activity_log');
  pgm.dropTable('post_versions');
  pgm.dropTable('comments');
  pgm.dropTable('post_tags');
  pgm.dropTable('posts');
  pgm.dropTable('media');
  pgm.dropTable('tags');
  pgm.dropTable('categories');
  pgm.dropTable('users');
};
