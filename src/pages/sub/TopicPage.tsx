import { Navigate } from 'react-router-dom'
import { topics } from '../../data/topics'
import { MarketingSubPage } from '../MarketingSubPage'

export function TopicPage({ topic }: { topic: string }) {
  const page = topics[topic]
  if (!page) return <Navigate to="/" replace />
  return <MarketingSubPage {...page} />
}
