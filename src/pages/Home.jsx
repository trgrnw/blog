import { useEffect, useMemo, useState } from 'react'
import Layout from '../components/Layout'
import PostCard from '../components/PostCard'
import { categories, listPosts } from '../lib/posts'

export default function Home() {
  const [posts, setPosts] = useState([]), [category, setCategory] = useState('Все'), [query, setQuery] = useState(''), [loading, setLoading] = useState(true)
  useEffect(() => { listPosts().then(setPosts).finally(() => setLoading(false)) }, [])
  const shown = useMemo(() => posts.filter((p) => (category === 'Все' || p.category === category) && `${p.title} ${p.excerpt} ${(p.tags || []).join(' ')}`.toLowerCase().includes(query.toLowerCase())), [posts, category, query])
  const featured = shown.find((post) => post.featured) || shown[0]
  return <Layout query={query} onQuery={setQuery}>
    <section className="hero"><div className="shell"><span className="eyebrow">THUGGER / BLOG</span><h1>Идеи превращаются<br/>в <em>проекты.</em></h1><p>Новости разработки, релизы, планы и материалы из личного блога.</p></div></section>
    <section className="shell content"><div className="section-title"><div><span>01 / В ФОКУСЕ</span><h2>Главная публикация</h2></div></div>
      {loading ? <div className="skeleton"/> : featured ? <PostCard post={featured} large/> : <div className="empty">Публикаций пока нет.</div>}
      <div className="feed-head"><div><span>02 / МАТЕРИАЛЫ</span><h2>Все публикации</h2></div><div className="filters">{categories.map((item) => <button className={category === item ? 'active' : ''} onClick={() => setCategory(item)} key={item}>{item}</button>)}</div></div>
      <div className="grid">{shown.filter((p) => p.id !== featured?.id).map((post) => <PostCard post={post} key={post.id}/>)}</div>
    </section>
  </Layout>
}
