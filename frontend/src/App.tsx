import {lazy, Suspense, useEffect, type ReactNode} from 'react'
import {Navigate, Route, Routes, useLocation} from 'react-router-dom'
import {Center} from '@astryxdesign/core/Center'
import {Spinner} from '@astryxdesign/core/Spinner'
import HomePage from './pages/HomePage'

// case studies pull in the code highlighter and the dog pages their own code; keep both out of the home page bundle
const ProjectPage = lazy(() => import('./pages/ProjectPage'))
const DogsPage = lazy(() => import('./pages/DogsPage'))
const DogBreedPage = lazy(() => import('./pages/DogBreedPage'))
const LifespanPage = lazy(() => import('./pages/LifespanPage'))

// shown while a lazily loaded page's code downloads, so navigation never flashes a blank screen
function Lazy({children}: {children: ReactNode}) {
  return (
    <Suspense
      fallback={
        <Center minHeight="60vh">
          <Spinner size="lg" aria-label="Loading page" />
        </Center>
      }>
      {children}
    </Suspense>
  )
}

export default function App() {
  const {pathname} = useLocation()
  // client-side navigation keeps the old scroll position; start each page at the top
  // block body on purpose: newer browsers return a Promise from scrollTo, and React would call it as a cleanup
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/projects/:slug" element={<Lazy><ProjectPage /></Lazy>} />
      <Route path="/dogs" element={<Lazy><DogsPage /></Lazy>} />
      <Route path="/dogs/lifespan" element={<Lazy><LifespanPage /></Lazy>} />
      <Route path="/dogs/:slug" element={<Lazy><DogBreedPage /></Lazy>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
