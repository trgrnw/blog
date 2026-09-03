import { Navigate, Route, Routes } from 'react-router-dom'
import Home from './pages/Home'
import Post from './pages/Post'
import Admin from './pages/Admin'

export default function App() { return <Routes><Route path="/" element={<Home/>}/><Route path="/post/:slug" element={<Post/>}/><Route path="/admin" element={<Admin/>}/><Route path="*" element={<Navigate to="/" replace/>}/></Routes> }
