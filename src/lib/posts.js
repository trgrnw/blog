import { configured, supabase } from './supabase'

export const categories = ['Все', 'Новости', 'Релизы', 'Разработка', 'Roadmap', 'Инструкции', 'Личный блог', 'Опросы']
export const demoPosts = [{
  id: 'welcome', slug: 'welcome-to-thugger', title: 'Добро пожаловать в Thugger', excerpt: 'Боты, сайты, приложения, игры и немного безумных идей — всё в одном месте.', category: 'Новости', tags: ['thugger', 'старт'], cover_url: '', featured: true, recommended: true, status: 'published', views: 0, reading_minutes: 2, published_at: new Date().toISOString(),
  content: '<p><strong>thugger</strong> — общий проект, объединяющий Telegram-ботов, веб-сайты, приложения, игры и другие эксперименты.</p><blockquote>Здесь выходят новости разработки, обновления, релизы, планы и материалы из личного блога.</blockquote><p>Сейчас мы только начинаем, но первые проекты уже находятся в разработке.</p>'
}]

export async function listPosts({ admin = false } = {}) {
  if (!configured) return demoPosts
  let query = supabase.from('posts').select('*').order('featured', { ascending: false }).order('published_at', { ascending: false })
  if (!admin) query = query.eq('status', 'published').lte('published_at', new Date().toISOString())
  const { data, error } = await query
  if (error) throw error
  return data
}

export async function getPost(slug) {
  if (!configured) return demoPosts.find((post) => post.slug === slug)
  const { data, error } = await supabase.from('posts').select('*').eq('slug', slug).single()
  if (error) throw error
  supabase.rpc('increment_post_views', { post_id_input: data.id }).then(() => {})
  return data
}

export async function savePost(post) {
  if (!configured) throw new Error('Сначала подключите Supabase в файле .env')
  const payload = { ...post, tags: String(post.tags || '').split(',').map((tag) => tag.trim()).filter(Boolean), updated_at: new Date().toISOString() }
  const { data, error } = await supabase.from('posts').upsert(payload).select().single()
  if (error) throw error
  return data
}

export async function deletePost(id) {
  const { error } = await supabase.from('posts').delete().eq('id', id)
  if (error) throw error
}

export async function uploadCover(file) {
  const ext = file.name.split('.').pop(); const path = `${crypto.randomUUID()}.${ext}`
  const { error } = await supabase.storage.from('blog-media').upload(path, file)
  if (error) throw error
  return supabase.storage.from('blog-media').getPublicUrl(path).data.publicUrl
}

export async function getEngagement(postId) {
  if (!configured) return { reactions: { like: 0, fire: 0, idea: 0 }, comments: [] }
  const [{ data: reactionRows, error: reactionError }, { data: comments, error: commentError }] = await Promise.all([
    supabase.from('post_reactions').select('reaction').eq('post_id', postId),
    supabase.from('comments').select('*').eq('post_id', postId).eq('approved', true).order('created_at'),
  ])
  if (reactionError || commentError) throw reactionError || commentError
  const reactions = { like: 0, fire: 0, idea: 0 }
  reactionRows.forEach(({ reaction }) => { reactions[reaction] = (reactions[reaction] || 0) + 1 })
  return { reactions, comments }
}

export async function reactToPost(postId, reaction) {
  if (!configured) return
  let visitorId = localStorage.getItem('thugger_visitor_id')
  if (!visitorId) { visitorId = crypto.randomUUID(); localStorage.setItem('thugger_visitor_id', visitorId) }
  const { error } = await supabase.from('post_reactions').upsert({ post_id: postId, visitor_id: visitorId, reaction }, { onConflict: 'post_id,visitor_id' })
  if (error) throw error
}

export async function submitComment(postId, authorName, body) {
  if (!configured) throw new Error('Комментарии появятся после подключения Supabase')
  const { error } = await supabase.from('comments').insert({ post_id: postId, author_name: authorName, body, approved: false })
  if (error) throw error
}
