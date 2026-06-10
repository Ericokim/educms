import bcrypt from 'bcryptjs'
import { COMMENT_STATUSES, POST_STATUSES, ROLES } from '@educms/shared'
import { env, isProduction } from '../config/env.js'
import { pool } from './pool.js'

const SEED_PASSWORD = process.env.SEED_PASSWORD || 'Password123!'

const users = [
  { username: 'admin', email: 'admin@educms.local', firstName: 'Alice', lastName: 'Nguyen', role: ROLES.ADMIN },
  { username: 'editor', email: 'editor@educms.local', firstName: 'Edgar', lastName: 'Reyes', role: ROLES.EDITOR },
  { username: 'author', email: 'author@educms.local', firstName: 'Aisha', lastName: 'Karim', role: ROLES.AUTHOR },
  { username: 'author2', email: 'author2@educms.local', firstName: 'Tom', lastName: 'Okafor', role: ROLES.AUTHOR },
  { username: 'subscriber', email: 'subscriber@educms.local', firstName: 'Sofia', lastName: 'Marin', role: ROLES.SUBSCRIBER },
]

const categories = [
  { name: 'Announcements', slug: 'announcements', description: 'Official school announcements and notices.' },
  { name: 'Course Materials', slug: 'course-materials', description: 'Lecture notes, readings, and supporting materials.' },
  { name: 'Tutorials', slug: 'tutorials', description: 'Step-by-step guides for students and staff.' },
  { name: 'Research', slug: 'research', description: 'Research highlights, papers, and findings.' },
  { name: 'Campus Life', slug: 'campus-life', description: 'Events, clubs, and student life stories.' },
]

const tags = [
  { name: 'Mathematics', slug: 'mathematics' },
  { name: 'Science', slug: 'science' },
  { name: 'Programming', slug: 'programming' },
  { name: 'Exams', slug: 'exams' },
  { name: 'Scholarships', slug: 'scholarships' },
  { name: 'Events', slug: 'events' },
  { name: 'Study Tips', slug: 'study-tips' },
  { name: 'Library', slug: 'library' },
]

interface SeedPost {
  title: string
  slug: string
  excerpt: string
  content: string
  status: string
  author: string
  category: string
  tags: string[]
  views: number
  daysAgo: number | null
}

const posts: SeedPost[] = [
  {
    title: 'Fall Semester Enrollment Opens August 1',
    slug: 'fall-semester-enrollment-opens-august-1',
    excerpt: 'Enrollment for the fall semester opens August 1. Here is everything you need to prepare.',
    content:
      '<h2>Key dates</h2><p>Enrollment opens <strong>August 1</strong> and closes August 25. Late enrollment carries an additional fee.</p><h2>How to enroll</h2><p>Log in to the student portal, pick your courses, and confirm your schedule with your adviser.</p><p>Questions? Contact the registrar at registrar@educms.local.</p>',
    status: POST_STATUSES.PUBLISHED,
    author: 'admin',
    category: 'announcements',
    tags: ['events'],
    views: 412,
    daysAgo: 20,
  },
  {
    title: 'Introduction to Algebra: Week 1 Notes',
    slug: 'introduction-to-algebra-week-1-notes',
    excerpt: 'Variables, expressions, and solving simple equations - the complete notes from week one.',
    content:
      '<h2>Variables and expressions</h2><p>A variable is a symbol that stands for an unknown value. An expression combines variables and constants with operations.</p><h2>Solving linear equations</h2><p>Isolate the variable by performing the same operation on both sides. Practice problems are attached at the end.</p>',
    status: POST_STATUSES.PUBLISHED,
    author: 'author',
    category: 'course-materials',
    tags: ['mathematics', 'study-tips'],
    views: 287,
    daysAgo: 15,
  },
  {
    title: 'How to Use the Online Library Catalog',
    slug: 'how-to-use-the-online-library-catalog',
    excerpt: 'A short tutorial on finding books, reserving copies, and accessing digital journals.',
    content:
      '<h2>Searching</h2><p>Use the search bar on the library homepage. Filter by author, subject, or publication year.</p><h2>Reservations</h2><p>Click "Reserve" on any available title. You will get an email when it is ready for pickup.</p><h2>Digital access</h2><p>Journals are available through your student account at no cost.</p>',
    status: POST_STATUSES.PUBLISHED,
    author: 'author2',
    category: 'tutorials',
    tags: ['library', 'study-tips'],
    views: 198,
    daysAgo: 12,
  },
  {
    title: 'Physics Lab Safety Guidelines',
    slug: 'physics-lab-safety-guidelines',
    excerpt: 'Required reading before your first lab session: equipment rules and emergency procedures.',
    content:
      '<h2>Before the lab</h2><p>Wear closed shoes and tie back long hair. Review the experiment sheet in advance.</p><h2>During the lab</h2><p>No food or drink. Report damaged equipment immediately to the supervisor.</p><h2>Emergencies</h2><p>Eye-wash stations are at each exit. The assembly point is the courtyard.</p>',
    status: POST_STATUSES.PUBLISHED,
    author: 'author',
    category: 'course-materials',
    tags: ['science'],
    views: 156,
    daysAgo: 10,
  },
  {
    title: 'Scholarship Applications for 2027 Now Open',
    slug: 'scholarship-applications-2027-now-open',
    excerpt: 'Merit and need-based scholarships are accepting applications until October 15.',
    content:
      '<h2>Available programs</h2><p>The merit scholarship covers full tuition; the need-based grant covers up to 60%.</p><h2>Requirements</h2><p>Transcript, two recommendation letters, and a personal statement of 500 words.</p><p>Submit through the financial aid office portal before <strong>October 15</strong>.</p>',
    status: POST_STATUSES.PUBLISHED,
    author: 'editor',
    category: 'announcements',
    tags: ['scholarships'],
    views: 523,
    daysAgo: 8,
  },
  {
    title: 'Getting Started with Python for Data Analysis',
    slug: 'getting-started-with-python-for-data-analysis',
    excerpt: 'Install Python, set up a notebook, and run your first analysis in under an hour.',
    content:
      '<h2>Installation</h2><p>Download Python 3 and install Jupyter with <code>pip install jupyter pandas</code>.</p><h2>First steps</h2><p>Load a CSV with pandas, inspect it with <code>df.head()</code>, and plot a column with <code>df.plot()</code>.</p><h2>Next</h2><p>Join the weekly data club on Thursdays in room B204.</p>',
    status: POST_STATUSES.PUBLISHED,
    author: 'author2',
    category: 'tutorials',
    tags: ['programming', 'science'],
    views: 341,
    daysAgo: 5,
  },
  {
    title: 'Midterm Exam Schedule - Draft',
    slug: 'midterm-exam-schedule-draft',
    excerpt: 'Draft schedule for midterm examinations, pending faculty confirmation.',
    content:
      '<p>The midterm window runs from week 8 to week 9. Room assignments will be confirmed by the faculty board before publication.</p>',
    status: POST_STATUSES.DRAFT,
    author: 'editor',
    category: 'announcements',
    tags: ['exams'],
    views: 0,
    daysAgo: null,
  },
  {
    title: 'Study Techniques That Actually Work',
    slug: 'study-techniques-that-actually-work',
    excerpt: 'Spaced repetition, active recall, and other evidence-backed methods.',
    content:
      '<p>Draft in progress: covering spaced repetition, active recall, the Pomodoro technique, and how to combine them into a weekly routine.</p>',
    status: POST_STATUSES.DRAFT,
    author: 'author',
    category: 'tutorials',
    tags: ['study-tips', 'exams'],
    views: 0,
    daysAgo: null,
  },
  {
    title: 'Research Spotlight: Renewable Energy on Campus',
    slug: 'research-spotlight-renewable-energy-on-campus',
    excerpt: 'Our engineering department measured the impact of the new solar array.',
    content:
      '<p>Draft notes from the interview with the engineering team. Charts and final figures pending review.</p>',
    status: POST_STATUSES.DRAFT,
    author: 'author2',
    category: 'research',
    tags: ['science'],
    views: 0,
    daysAgo: null,
  },
  {
    title: 'Spring Festival 2026 Recap',
    slug: 'spring-festival-2026-recap',
    excerpt: 'Photos and highlights from last year’s spring festival.',
    content:
      '<p>Over 800 students attended the spring festival. The robotics club demo and the open-mic night were the most popular events.</p>',
    status: POST_STATUSES.ARCHIVED,
    author: 'editor',
    category: 'campus-life',
    tags: ['events'],
    views: 264,
    daysAgo: 90,
  },
]

const comments = [
  { post: 'fall-semester-enrollment-opens-august-1', user: 'subscriber', status: COMMENT_STATUSES.APPROVED, content: 'Is late enrollment open to part-time students as well?' },
  { post: 'fall-semester-enrollment-opens-august-1', user: 'author', status: COMMENT_STATUSES.APPROVED, content: 'Reminder that adviser meetings book up fast in the first week.' },
  { post: 'introduction-to-algebra-week-1-notes', user: 'subscriber', status: COMMENT_STATUSES.APPROVED, content: 'These notes are really clear, thank you!' },
  { post: 'introduction-to-algebra-week-1-notes', user: 'subscriber', status: COMMENT_STATUSES.PENDING, content: 'Will there be a video recording of the lecture?' },
  { post: 'how-to-use-the-online-library-catalog', user: 'subscriber', status: COMMENT_STATUSES.PENDING, content: 'The reserve button does not show up for me on mobile.' },
  { post: 'physics-lab-safety-guidelines', user: 'subscriber', status: COMMENT_STATUSES.APPROVED, content: 'Where can we get replacement safety goggles?' },
  { post: 'scholarship-applications-2027-now-open', user: 'subscriber', status: COMMENT_STATUSES.PENDING, content: 'Can international students apply for the merit scholarship?' },
  { post: 'scholarship-applications-2027-now-open', user: null, status: COMMENT_STATUSES.SPAM, content: 'Get guaranteed scholarships fast at totally-real-grants dot com!!!' },
  { post: 'getting-started-with-python-for-data-analysis', user: 'subscriber', status: COMMENT_STATUSES.APPROVED, content: 'The data club is great, highly recommend joining.' },
  { post: 'getting-started-with-python-for-data-analysis', user: null, status: COMMENT_STATUSES.TRASH, content: 'first' },
]

async function seed() {
  if (isProduction) {
    console.error('Refusing to seed: NODE_ENV is production.')
    process.exit(1)
  }

  // Seeding truncates every table, so never point it at a remote database
  // by accident; require an explicit override for non-local hosts.
  const dbHost = new URL(env.databaseUrl).hostname
  const isLocalDb = ['localhost', '127.0.0.1', '::1'].includes(dbHost)
  if (!isLocalDb && process.env.ALLOW_REMOTE_SEED !== 'true') {
    console.error(
      `Refusing to seed: DATABASE_URL points at non-local host "${dbHost}". ` +
        'Set ALLOW_REMOTE_SEED=true if this is intentional.'
    )
    process.exit(1)
  }

  console.log('Seeding database...')

  await pool.query(
    'TRUNCATE activity_log, post_versions, comments, post_tags, posts, media, tags, categories, users RESTART IDENTITY CASCADE'
  )

  const passwordHash = await bcrypt.hash(SEED_PASSWORD, env.bcryptRounds)

  const userIds = new Map<string, number>()
  for (const u of users) {
    const result = await pool.query(
      `INSERT INTO users (username, email, password_hash, first_name, last_name, role)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
      [u.username, u.email, passwordHash, u.firstName, u.lastName, u.role]
    )
    userIds.set(u.username, result.rows[0].id)
  }

  const categoryIds = new Map<string, number>()
  for (const c of categories) {
    const result = await pool.query(
      'INSERT INTO categories (name, slug, description) VALUES ($1, $2, $3) RETURNING id',
      [c.name, c.slug, c.description]
    )
    categoryIds.set(c.slug, result.rows[0].id)
  }

  const tagIds = new Map<string, number>()
  for (const t of tags) {
    const result = await pool.query(
      'INSERT INTO tags (name, slug) VALUES ($1, $2) RETURNING id',
      [t.name, t.slug]
    )
    tagIds.set(t.slug, result.rows[0].id)
  }

  const postIds = new Map<string, number>()
  for (const p of posts) {
    const authorId = userIds.get(p.author)
    const publishedAt =
      p.daysAgo === null || p.status !== POST_STATUSES.PUBLISHED
        ? null
        : new Date(Date.now() - p.daysAgo * 24 * 60 * 60 * 1000)
    const result = await pool.query(
      `INSERT INTO posts
         (title, slug, excerpt, content, status, author_id, category_id,
          meta_title, meta_description, meta_keywords, view_count, published_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING id`,
      [
        p.title,
        p.slug,
        p.excerpt,
        p.content,
        p.status,
        authorId,
        categoryIds.get(p.category),
        p.title,
        p.excerpt,
        p.tags.join(', '),
        p.views,
        publishedAt,
      ]
    )
    const postId = result.rows[0].id
    postIds.set(p.slug, postId)

    for (const tagSlug of p.tags) {
      await pool.query('INSERT INTO post_tags (post_id, tag_id) VALUES ($1, $2)', [
        postId,
        tagIds.get(tagSlug),
      ])
    }

    await pool.query(
      `INSERT INTO post_versions
         (post_id, version_number, title, content, excerpt,
          meta_title, meta_description, meta_keywords, status, created_by)
       VALUES ($1, 1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [postId, p.title, p.content, p.excerpt, p.title, p.excerpt, p.tags.join(', '), p.status, authorId]
    )
  }

  for (const c of comments) {
    await pool.query(
      'INSERT INTO comments (post_id, user_id, content, status) VALUES ($1, $2, $3, $4)',
      [postIds.get(c.post), c.user ? userIds.get(c.user) : null, c.content, c.status]
    )
  }

  const counts = await pool.query(
    `SELECT
       (SELECT count(*) FROM users) AS users,
       (SELECT count(*) FROM categories) AS categories,
       (SELECT count(*) FROM tags) AS tags,
       (SELECT count(*) FROM posts) AS posts,
       (SELECT count(*) FROM post_tags) AS post_tags,
       (SELECT count(*) FROM post_versions) AS post_versions,
       (SELECT count(*) FROM comments) AS comments`
  )
  console.log('Seed complete:', counts.rows[0])
  console.log(`All seed users share the password: ${SEED_PASSWORD}`)
}

seed()
  .catch((error) => {
    console.error('Seed failed:', error)
    process.exitCode = 1
  })
  .finally(() => pool.end())
