import { HashRouter, Routes, Route } from 'react-router-dom'
import { Layout } from './components/layout/Layout'
import { AuthGate } from './components/AuthGate'
import { Dashboard } from './pages/Dashboard'
import { ProjectNew } from './pages/ProjectNew'
import { ProjectDetail } from './pages/ProjectDetail'
import { FeedbackAll } from './pages/FeedbackAll'
import { ClientReview } from './pages/ClientReview'

export default function App() {
  return (
    <HashRouter>
      <Routes>
        {/* Public client review - no auth */}
        <Route path="/review/:token" element={<ClientReview />} />

        {/* Admin - requires auth */}
        <Route path="/*" element={
          <AuthGate>
            <Routes>
              <Route element={<Layout />}>
                <Route path="/" element={<Dashboard />} />
                <Route path="/projects/new" element={<ProjectNew />} />
                <Route path="/projects/:projectId" element={<ProjectDetail />} />
                <Route path="/feedback" element={<FeedbackAll />} />
              </Route>
            </Routes>
          </AuthGate>
        } />
      </Routes>
    </HashRouter>
  )
}
