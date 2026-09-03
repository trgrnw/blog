import { ArrowLeft, Bold, Code, Eye, Image, Italic, Link as LinkIcon, List, ListOrdered, Quote, Save, Underline } from 'lucide-react'
import { useRef, useState } from 'react'
import { categories, savePost, uploadCover } from '../lib/posts'
import '../admin-fixes.css'

const blank = { title: '', slug: '', excerpt: '', category: 'Новости', tags: '', cover_url: '', content: '', status: 'draft', featured: false, recommended: false, reading_minutes: 3 }

export default function Editor({ post, onClose }) {
  const [form, setForm] = useState(() => ({ ...blank, ...post, tags: Array.isArray(post?.tags) ? post.tags.join(', ') : post?.tags || '', content: post?.content || localStorage.getItem('thugger_editor_recovery') || '' }))
  const [preview, setPreview] = useState(false)
  const [saving, setSaving] = useState(false)
  const [notice, setNotice] = useState('')
  const body = useRef(null)
  const update = (key, value) => setForm((old) => ({ ...old, [key]: value }))
  const command = (name, value = null) => { document.execCommand(name, false, value); body.current?.focus() }

  async function submit(status) {
    setSaving(true)
    try {
      const content = body.current?.innerHTML || form.content
      const published_at = status === 'published' ? (form.published_at || new Date().toISOString()) : form.published_at
      await savePost({ ...form, content, status, published_at })
      localStorage.removeItem('thugger_editor_recovery')
      setNotice('Сохранено')
      setTimeout(onClose, 500)
    } catch (error) { setNotice(error.message) } finally { setSaving(false) }
  }

  async function cover(event) {
    const file = event.target.files[0]
    if (file) update('cover_url', await uploadCover(file))
  }

  return <div className="editor">
    <header><button className="back" onClick={onClose}><ArrowLeft/>К публикациям</button><div><button onClick={() => setPreview(!preview)}><Eye/>Предпросмотр</button><button onClick={() => submit('draft')}><Save/>Черновик</button><button className="primary" disabled={saving} onClick={() => submit('published')}>Опубликовать</button></div></header>
    {preview ? <article className="article preview"><span className="category">{form.category}</span><h1>{form.title || 'Заголовок публикации'}</h1><p>{form.excerpt}</p>{form.cover_url && <img className="article-cover" src={form.cover_url}/>}<div className="prose" dangerouslySetInnerHTML={{ __html: body.current?.innerHTML || form.content }}/></article>
      : <div className="editor-grid"><section>
        <label>Заголовок<input value={form.title} onChange={(event) => { update('title', event.target.value); if (!post) update('slug', event.target.value.toLowerCase().replace(/[^a-zа-яё0-9]+/gi, '-').replace(/^-|-$/g, '')) }}/></label>
        <label>Краткое описание<textarea value={form.excerpt} onChange={(event) => update('excerpt', event.target.value)}/></label>
        <div className="toolbar"><button onClick={() => command('bold')} title="Жирный"><Bold/></button><button onClick={() => command('italic')} title="Курсив"><Italic/></button><button onClick={() => command('underline')} title="Подчёркивание"><Underline/></button><button onClick={() => command('formatBlock', 'blockquote')} title="Цитата"><Quote/></button><button onClick={() => command('insertUnorderedList')} title="Маркированный список"><List/></button><button onClick={() => command('insertOrderedList')} title="Нумерованный список"><ListOrdered/></button><button onClick={() => command('formatBlock', 'pre')} title="Код"><Code/></button><button onClick={() => command('createLink', prompt('Введите ссылку'))} title="Ссылка"><LinkIcon/></button></div>
        <div ref={body} className="rich" dir="ltr" contentEditable suppressContentEditableWarning onInput={(event) => localStorage.setItem('thugger_editor_recovery', event.currentTarget.innerHTML)} dangerouslySetInnerHTML={{ __html: form.content }}/>
      </section><aside>
        <label>Обложка<div className="upload">{form.cover_url ? <img src={form.cover_url}/> : <><Image/><span>Выбрать изображение</span></>}<input type="file" accept="image/*" onChange={cover}/></div></label>
        <label>Адрес статьи<input value={form.slug} onChange={(event) => update('slug', event.target.value)}/></label>
        <label>Категория<select value={form.category} onChange={(event) => update('category', event.target.value)}>{categories.slice(1).map((category) => <option key={category}>{category}</option>)}</select></label>
        <label>Теги<input value={form.tags} onChange={(event) => update('tags', event.target.value)} placeholder="боты, релиз"/></label>
        <label><input type="checkbox" checked={form.featured} onChange={(event) => update('featured', event.target.checked)}/> Закрепить публикацию</label>
        <label><input type="checkbox" checked={form.recommended} onChange={(event) => update('recommended', event.target.checked)}/> Добавить в рекомендации</label>
        {notice && <p className="notice">{notice}</p>}
      </aside></div>}
  </div>
}
