import { HashRouter, Routes, Route } from 'react-router-dom'
import { Layout } from './components/layout/Layout'
import { AuthGate } from './components/AuthGate'
import { Dashboard } from './pages/Dashboard'
import { ProjectNew } from './pages/ProjectNew'
import { ProjectDetail } from './pages/ProjectDetail'
import { FeedbackAll } from './pages/FeedbackAll'

export default function App() {
  return (
    <AuthGate>
      <HashRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/projects/new" element={<ProjectNew />} />
            <Route path="/projects/:projectId" element={<ProjectDetail />} />
            <Route path="/feedback" element={<FeedbackAll />} />
          </Route>
        </Routes>
      </HashRouter>
    </AuthGate>
  )
}
