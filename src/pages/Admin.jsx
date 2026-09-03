import { useEffect, useState } from 'react'
import { Edit3, LogOut, Plus, Trash2 } from 'lucide-react'
import { configured, supabase } from '../lib/supabase'
import { deletePost, listPosts } from '../lib/posts'
import Editor from './Editor'

export default function Admin() {
  const [session, setSession] = useState(null), [email, setEmail] = useState(''), [password, setPassword] = useState(''), [posts, setPosts] = useState([]), [editing, setEditing] = useState(null), [message, setMessage] = useState('')
  useEffect(() => { if (!configured) return; supabase.auth.getSession().then(({ data }) => setSession(data.session)); const { data } = supabase.auth.onAuthStateChange((_, value) => setSession(value)); return () => data.subscription.unsubscribe() }, [])
  useEffect(() => { if (session) listPosts({ admin: true }).then(setPosts) }, [session, editing])
  async function login(e) { e.preventDefault(); const { error } = await supabase.auth.signInWithPassword({ email, password }); if (error) setMessage(error.message) }
  const logo = <div className="brand brand-image"><img src={`${import.meta.env.BASE_URL}thugger-logo.png`} alt="THUGGER"/><small>ADMIN</small></div>
  if (!configured) return <div className="admin-login"><div>{logo}<h1>Подключите Supabase</h1><p>Скопируйте <code>.env.example</code> в <code>.env</code> и заполните публичные параметры проекта.</p></div></div>
  if (!session) return <div className="admin-login"><form onSubmit={login}>{logo}<h1>Вход в редактор</h1><input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required/><input type="password" placeholder="Пароль" value={password} onChange={(e) => setPassword(e.target.value)} required/><button>Войти</button>{message && <p className="error">{message}</p>}</form></div>
  if (editing !== null) return <Editor post={editing || undefined} onClose={() => setEditing(null)}/>
  return <div className="admin"><aside>{logo}<nav><button className="active">Публикации</button><a href="/blog/">Открыть блог</a></nav><button className="logout" onClick={() => supabase.auth.signOut()}><LogOut/>Выйти</button></aside><main><header><div><span>ПАНЕЛЬ УПРАВЛЕНИЯ</span><h1>Публикации</h1></div><button className="primary" onClick={() => setEditing(false)}><Plus/>Новый пост</button></header><div className="admin-list">{posts.map((post) => <div className="admin-row" key={post.id}><div><span className={`status ${post.status}`}>{post.status === 'published' ? 'Опубликован' : 'Черновик'}</span><h3>{post.title}</h3><p>{post.category} · /{post.slug}</p></div><div><button onClick={() => setEditing(post)}><Edit3/></button><button className="danger" onClick={async () => { if (confirm('Удалить публикацию?')) { await deletePost(post.id); setPosts(posts.filter((p) => p.id !== post.id)) } }}><Trash2/></button></div></div>)}</div></main></div>
}
