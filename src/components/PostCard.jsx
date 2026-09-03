import { ArrowUpRight, Clock, Eye } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function PostCard({ post, large = false }) {
  const date = new Date(post.published_at || post.created_at).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })
  return <article className={`post-card ${large ? 'large' : ''}`}>
    <Link to={`/post/${post.slug}`} className="cover">{post.cover_url ? <img src={post.cover_url} alt=""/> : <div className="cover-art"><b>/T.</b></div>}</Link>
    <div className="post-body"><div className="meta"><span className="category">{post.category}</span><span>{date}</span></div>
      <Link to={`/post/${post.slug}`}><h2>{post.title}</h2></Link><p>{post.excerpt}</p>
      <div className="post-foot"><span><Clock size={14}/>{post.reading_minutes || 3} мин</span><span><Eye size={14}/>{post.views || 0}</span><Link aria-label="Открыть" to={`/post/${post.slug}`}><ArrowUpRight/></Link></div>
    </div>
  </article>
}
