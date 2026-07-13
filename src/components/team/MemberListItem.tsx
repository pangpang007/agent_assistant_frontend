import { Button } from '@/components/ui/Button';
import { Tag } from '@/components/ui/Tag';
import type { TeamMember } from '@/types';
import './MemberListItem.css';

interface MemberListItemProps {
  member: TeamMember;
  isCurrentUser: boolean;
  isOwner: boolean;
  onRemove?: (memberId: string) => void;
  isLast?: boolean;
}

export function MemberListItem({
  member,
  isCurrentUser,
  isOwner,
  onRemove,
  isLast = false,
}: MemberListItemProps) {
  const initial = member.username.charAt(0).toUpperCase();

  return (
    <div className={`member-list-item ${isLast ? 'member-list-item--last' : ''}`}>
      <div className="member-list-item__avatar">
        {member.avatar_url ? (
          <img src={member.avatar_url} alt={member.username} />
        ) : (
          initial
        )}
      </div>
      <div className="member-list-item__info">
        <div className="member-list-item__name">{member.username}</div>
        <div className="member-list-item__email">{member.email}</div>
      </div>
      <Tag color={member.role === 'owner' ? 'primary' : 'default'}>
        {member.role === 'owner' ? 'Owner' : 'Member'}
      </Tag>
      <div className="member-list-item__action">
        {isCurrentUser || !isOwner || member.role === 'owner' ? (
          <span className="member-list-item__dash">—</span>
        ) : (
          <Button variant="ghost" size="sm" onClick={() => onRemove?.(member.id)}>
            移除
          </Button>
        )}
      </div>
    </div>
  );
}
