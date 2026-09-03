import { Search, Menu, X } from 'lucide-react'
import { useState } from 'react'
import { Link, NavLink } from 'react-router-dom'

export default function Layout({ children, query = '', onQuery }) {
  const [open, setOpen] = useState(false)
  return <>
    <header className="header"><div className="shell nav">
      <Link className="brand brand-image" to="/"><img src={`${import.meta.env.BASE_URL}thugger-logo.png`} alt="THUGGER"/><small>BLOG</small></Link>
      <nav className={open ? 'navlinks open' : 'navlinks'}>
        <NavLink to="/">Главная</NavLink><a href="https://thugger.ru">Проекты</a><a href="https://t.me/thugger_blog">Telegram</a>
      </nav>
      <div className="search"><Search size={17}/><input aria-label="Поиск" value={query} onChange={(e) => onQuery?.(e.target.value)} placeholder="Поиск" /></div>
      <button className="mobile" onClick={() => setOpen(!open)} aria-label="Меню">{open ? <X/> : <Menu/>}</button>
    </div></header>
    <main>{children}</main>
    <footer><div className="shell footer"><div className="brand brand-image"><img src={`${import.meta.env.BASE_URL}thugger-logo.png`} alt="THUGGER"/></div><p>Боты, сайты, приложения, игры и личный блог.</p><span>© {new Date().getFullYear()}</span></div></footer>
  </>
}
