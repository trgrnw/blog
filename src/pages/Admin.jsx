import { useEffect, useState } from 'react'
import { Check, Edit3, LogOut, MessageSquare, Plus, Trash2, X } from 'lucide-react'
import { configured, supabase } from '../lib/supabase'
import { approveComment, deleteComment, deletePost, listCommentsForAdmin, listPosts } from '../lib/posts'
import Editor from './Editor'
import '../admin-fixes.css'

export default function Admin() {
  const [session, setSession] = useState(null)
  const [email, setEmail] = useState(''), [password, setPassword] = useState('')
  const [posts, setPosts] = useState([]), [comments, setComments] = useState([])
  const [editing, setEditing] = useState(null), [tab, setTab] = useState('posts')
  const [message, setMessage] = useState(''), [deleteTarget, setDeleteTarget] = useState(null)

  useEffect(() => { if (!configured) return undefined; supabase.auth.getSession().then(({ data }) => setSession(data.session)); const { data } = supabase.auth.onAuthStateChange((_, value) => setSession(value)); return () => data.subscription.unsubscribe() }, [])
  useEffect(() => { if (!session) return; Promise.all([listPosts({ admin: true }), listCommentsForAdmin()]).then(([postRows, commentRows]) => { setPosts(postRows); setComments(commentRows) }).catch((error) => setMessage(error.message)) }, [session, editing])

  async function login(event) { event.preventDefault(); const { error } = await supabase.auth.signInWithPassword({ email, password }); if (error) setMessage(error.message) }
  async function confirmDelete() {
    if (!deleteTarget) return
    try {
      if (deleteTarget.type === 'post') { await deletePost(deleteTarget.id); setPosts((rows) => rows.filter((item) => item.id !== deleteTarget.id)) }
      else { await deleteComment(deleteTarget.id); setComments((rows) => rows.filter((item) => item.id !== deleteTarget.id)) }
      setDeleteTarget(null)
    } catch (error) { setMessage(error.message); setDeleteTarget(null) }
  }

  const logo = <div className="brand brand-image"><img src={`${import.meta.env.BASE_URL}thugger-logo.png`} alt="THUGGER"/><small>ADMIN</small></div>
  if (!configured) return <div className="admin-login"><div>{logo}<h1>Подключите Supabase</h1><p>Скопируйте <code>.env.example</code> в <code>.env</code> и заполните публичные параметры проекта.</p></div></div>
  if (!session) return <div className="admin-login"><form onSubmit={login}>{logo}<h1>Вход в редактор</h1><input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required/><input type="password" placeholder="Пароль" value={password} onChange={(e) => setPassword(e.target.value)} required/><button>Войти</button>{message && <p className="error">{message}</p>}</form></div>
  if (editing !== null) return <Editor post={editing || undefined} onClose={() => setEditing(null)}/>

  const pendingCount = comments.filter((comment) => !comment.approved).length
  return <div className="admin"><aside>{logo}<nav><button className={tab === 'posts' ? 'active' : ''} onClick={() => setTab('posts')}>Публикации</button><button className={tab === 'comments' ? 'active' : ''} onClick={() => setTab('comments')}><MessageSquare/>Комментарии{pendingCount > 0 && <b className="nav-count">{pendingCount}</b>}</button><a href="/blog/">Открыть блог</a></nav><button className="logout" onClick={() => supabase.auth.signOut()}><LogOut/>Выйти</button></aside><main><header><div><span>ПАНЕЛЬ УПРАВЛЕНИЯ</span><h1>{tab === 'posts' ? 'Публикации' : 'Комментарии'}</h1></div>{tab === 'posts' && <button className="primary" onClick={() => setEditing(false)}><Plus/>Новый пост</button>}</header>{message && <p className="error">{message}</p>}
    {tab === 'posts' ? <div className="admin-list">{posts.map((post) => <div className="admin-row" key={post.id}><div><span className={`status ${post.status}`}>{post.status === 'published' ? 'Опубликован' : 'Черновик'}</span><h3>{post.title}</h3><p>{post.category} · /{post.slug}</p></div><div><button onClick={() => setEditing(post)}><Edit3/></button><button className="danger" onClick={() => setDeleteTarget({ type: 'post', id: post.id, name: post.title })}><Trash2/></button></div></div>)}{posts.length === 0 && <div className="admin-empty">Публикаций пока нет.</div>}</div>
    : <div className="admin-list comments-admin">{comments.map((comment) => <div className="admin-row comment-row" key={comment.id}><div><span className={`status ${comment.approved ? 'published' : ''}`}>{comment.approved ? 'Одобрен' : 'Ожидает модерации'}</span><h3>{comment.author_name}</h3><p className="comment-body">{comment.body}</p><p>{comment.posts?.title || 'Публикация'} · {new Date(comment.created_at).toLocaleString('ru-RU')}</p></div><div>{!comment.approved && <button className="approve" title="Одобрить" onClick={async () => { await approveComment(comment.id); setComments((rows) => rows.map((item) => item.id === comment.id ? { ...item, approved: true } : item)) }}><Check/></button>}<button className="danger" title="Удалить" onClick={() => setDeleteTarget({ type: 'comment', id: comment.id, name: `комментарий от ${comment.author_name}` })}><Trash2/></button></div></div>)}{comments.length === 0 && <div className="admin-empty">Комментариев пока нет.</div>}</div>}
  </main>{deleteTarget && <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setDeleteTarget(null) }}><div className="editor-modal delete-modal"><button type="button" className="modal-close" onClick={() => setDeleteTarget(null)}><X/></button><span>ПОДТВЕРЖДЕНИЕ</span><h2>Удалить безвозвратно?</h2><p>Вы собираетесь удалить <strong>«{deleteTarget.name}»</strong>. Восстановить этот элемент после удаления не получится.</p><div><button type="button" onClick={() => setDeleteTarget(null)}>Отмена</button><button type="button" className="danger-action" onClick={confirmDelete}><Trash2/>Удалить</button></div></div></div>}</div>
}
