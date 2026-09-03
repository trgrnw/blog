import { useEffect, useState } from 'react'
import { Check, Edit3, LogOut, MessageSquare, Plus, Trash2 } from 'lucide-react'
import { configured, supabase } from '../lib/supabase'
import { approveComment, deleteComment, deletePost, listCommentsForAdmin, listPosts } from '../lib/posts'
import Editor from './Editor'
import '../admin-fixes.css'

export default function Admin() {
  const [session, setSession] = useState(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [posts, setPosts] = useState([])
  const [comments, setComments] = useState([])
  const [editing, setEditing] = useState(null)
  const [tab, setTab] = useState('posts')
  const [message, setMessage] = useState('')
  useEffect(() => { if (!configured) return undefined; supabase.auth.getSession().then(({ data }) => setSession(data.session)); const { data } = supabase.auth.onAuthStateChange((_, value) => setSession(value)); return () => data.subscription.unsubscribe() }, [])
  useEffect(() => { if (!session) return; Promise.all([listPosts({ admin: true }), listCommentsForAdmin()]).then(([postRows, commentRows]) => { setPosts(postRows); setComments(commentRows) }).catch((error) => setMessage(error.message)) }, [session, editing])
  async function login(event) { event.preventDefault(); const { error } = await supabase.auth.signInWithPassword({ email, password }); if (error) setMessage(error.message) }
  const logo = <div className="brand brand-image"><img src={`${import.meta.env.BASE_URL}thugger-logo.png`} alt="THUGGER"/><small>ADMIN</small></div>
  if (!configured) return <div className="admin-login"><div>{logo}<h1>Подключите Supabase</h1><p>Скопируйте <code>.env.example</code> в <code>.env</code> и заполните публичные параметры проекта.</p></div></div>
  if (!session) return <div className="admin-login"><form onSubmit={login}>{logo}<h1>Вход в редактор</h1><input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required/><input type="password" placeholder="Пароль" value={password} onChange={(e) => setPassword(e.target.value)} required/><button>Войти</button>{message && <p className="error">{message}</p>}</form></div>
  if (editing !== null) return <Editor post={editing || undefined} onClose={() => setEditing(null)}/>
  const pendingCount = comments.filter((comment) => !comment.approved).length
  return <div className="admin"><aside>{logo}<nav><button className={tab === 'posts' ? 'active' : ''} onClick={() => setTab('posts')}>Публикации</button><button className={tab === 'comments' ? 'active' : ''} onClick={() => setTab('comments')}><MessageSquare/>Комментарии{pendingCount > 0 && <b className="nav-count">{pendingCount}</b>}</button><a href="/blog/">Открыть блог</a></nav><button className="logout" onClick={() => supabase.auth.signOut()}><LogOut/>Выйти</button></aside><main><header><div><span>ПАНЕЛЬ УПРАВЛЕНИЯ</span><h1>{tab === 'posts' ? 'Публикации' : 'Комментарии'}</h1></div>{tab === 'posts' && <button className="primary" onClick={() => setEditing(false)}><Plus/>Новый пост</button>}</header>{message && <p className="error">{message}</p>}{tab === 'posts' ? <div className="admin-list">{posts.map((post) => <div className="admin-row" key={post.id}><div><span className={`status ${post.status}`}>{post.status === 'published' ? 'Опубликован' : 'Черновик'}</span><h3>{post.title}</h3><p>{post.category} · /{post.slug}</p></div><div><button onClick={() => setEditing(post)}><Edit3/></button><button className="danger" onClick={async () => { if (confirm('Удалить публикацию?')) { await deletePost(post.id); setPosts(posts.filter((item) => item.id !== post.id)) } }}><Trash2/></button></div></div>)}{posts.length === 0 && <div className="admin-empty">Публикаций пока нет.</div>}</div> : <div className="admin-list comments-admin">{comments.map((comment) => <div className="admin-row comment-row" key={comment.id}><div><span className={`status ${comment.approved ? 'published' : ''}`}>{comment.approved ? 'Одобрен' : 'Ожидает модерации'}</span><h3>{comment.author_name}</h3><p className="comment-body">{comment.body}</p><p>{comment.posts?.title || 'Публикация'} · {new Date(comment.created_at).toLocaleString('ru-RU')}</p></div><div>{!comment.approved && <button className="approve" title="Одобрить" onClick={async () => { await approveComment(comment.id); setComments(comments.map((item) => item.id === comment.id ? { ...item, approved: true } : item)) }}><Check/></button>}<button className="danger" title="Удалить" onClick={async () => { if (confirm('Удалить комментарий?')) { await deleteComment(comment.id); setComments(comments.filter((item) => item.id !== comment.id)) } }}><Trash2/></button></div></div>)}{comments.length === 0 && <div className="admin-empty">Комментариев пока нет.</div>}</div>}</main></div>
}
