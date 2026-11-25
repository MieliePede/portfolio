import {lazy, Suspense, useEffect} from 'react'
import {Navigate, Route, Routes, useLocation} from 'react-router-dom'
import HomePage from './pages/HomePage'

// case studies pull in the code highlighter; keep it out of the home page bundle
const ProjectPage = lazy(() => import('./pages/ProjectPage'))
const DogsPage = lazy(() => import('./pages/DogsPage'))
const DogBreedPage = lazy(() => import('./pages/DogBreedPage'))

export default function App() {
  const {pathname} = useLocation()
  // client-side navigation keeps the old scroll position; start each page at the top
  useEffect(() => window.scrollTo(0, 0), [pathname])

  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/projects/:slug" element={<Suspense><ProjectPage /></Suspense>} />
      <Route path="/dogs" element={<Suspense><DogsPage /></Suspense>} />
      <Route path="/dogs/:slug" element={<Suspense><DogBreedPage /></Suspense>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
