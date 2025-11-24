import { ClickableTile, Tag, Button } from '@carbon/react'
import { ThumbsUp, ThumbsDown, Chat, ArrowRight } from '@carbon/icons-react'
import { Avatar } from '@/components/ui/Avatar'
import type { Idea, IdeaStatus } from '@/types'

interface IdeaCardProps {
  idea: Idea
  currentUserId?: number
  onVote?: (id: number, isUpvote: boolean) => void
  onUnvote?: (id: number) => void
  onClick?: () => void
}

const statusColors: Record<IdeaStatus, 'gray' | 'blue' | 'green' | 'cyan' | 'purple' | 'red'> = {
  new: 'gray',
  under_review: 'blue',
  approved: 'cyan',
  in_progress: 'purple',
  implemented: 'green',
  rejected: 'red',
}

const categoryColors: Record<string, 'gray' | 'blue' | 'green' | 'teal'> = {
  process: 'blue',
  product: 'green',
  culture: 'teal',
  other: 'gray',
}

export function IdeaCard({ idea, currentUserId, onVote, onUnvote, onClick }: IdeaCardProps) {
  const isOwner = currentUserId === idea.author.id

  const handleVoteClick = (e: React.MouseEvent, isUpvote: boolean) => {
    e.stopPropagation()
    if (isOwner) return // Don't allow voting on own idea
    if (idea.user_vote === (isUpvote ? 'up' : 'down')) {
      onUnvote?.(idea.id)
    } else {
      onVote?.(idea.id, isUpvote)
    }
  }

  const scoreClass = idea.votes_score > 0
    ? 'positive'
    : idea.votes_score < 0
      ? 'negative'
      : ''

  return (
    <ClickableTile
      onClick={onClick}
      className="idea-card"
    >
      <div className="idea-card__layout">
        {/* Voting section - left side */}
        <div className={`idea-card__voting ${isOwner ? 'idea-card__voting--disabled' : ''}`}>
          <Button
            kind={idea.user_vote === 'up' ? 'primary' : 'ghost'}
            size="sm"
            hasIconOnly
            renderIcon={ThumbsUp}
            iconDescription="За"
            onClick={(e: React.MouseEvent) => handleVoteClick(e, true)}
            className="idea-card__vote-btn"
            disabled={isOwner}
          />
          <div className={`idea-card__score ${scoreClass}`}>
            {idea.votes_score > 0 ? '+' : ''}{idea.votes_score}
          </div>
          <Button
            kind={idea.user_vote === 'down' ? 'danger--tertiary' : 'ghost'}
            size="sm"
            hasIconOnly
            renderIcon={ThumbsDown}
            iconDescription="Против"
            onClick={(e: React.MouseEvent) => handleVoteClick(e, false)}
            className="idea-card__vote-btn"
            disabled={isOwner}
          />
        </div>

        {/* Content section */}
        <div className="idea-card__content">
          {/* Tags row */}
          <div className="idea-card__tags">
            <Tag type={categoryColors[idea.category] || 'gray'} size="sm">
              {idea.category_display}
            </Tag>
            <Tag type={statusColors[idea.status]} size="sm">
              {idea.status_display}
            </Tag>
          </div>

          {/* Title and description */}
          <h3 className="idea-card__title">{idea.title}</h3>
          <p className="idea-card__description">{idea.description}</p>

          {/* Footer with author and meta */}
          <div className="idea-card__footer">
            <div className="idea-card__author">
              <Avatar
                name={idea.author.full_name}
                src={idea.author.avatar}
                size={28}
              />
              <div className="idea-card__author-info">
                <span className="idea-card__author-name">{idea.author.full_name}</span>
                <span className="idea-card__date">
                  {new Date(idea.created_at).toLocaleDateString('ru-RU')}
                </span>
              </div>
            </div>

            <div className="idea-card__meta">
              <span className="idea-card__comments">
                <Chat size={16} />
                <span>{idea.comments_count}</span>
              </span>
              <ArrowRight size={16} className="idea-card__arrow" />
            </div>
          </div>
        </div>
      </div>
    </ClickableTile>
  )
}
