/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { UserProfile } from '../types/expense';
import { User, Users } from 'lucide-react';

interface PaidByBadgeProps {
  paidBy: 'me' | 'friend';
  profile: UserProfile;
  className?: string;
  showIcon?: boolean;
}

export const PaidByBadge: React.FC<PaidByBadgeProps> = ({
  paidBy,
  profile,
  className = '',
  showIcon = true,
}) => {
  const isMe = paidBy === 'me';
  const name = isMe ? profile.meName : profile.friendName;

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-bold tracking-tight shadow-2xs shrink-0 transition-all ${
        isMe
          ? 'bg-[#0071E3]/12 text-[#0071E3] border border-[#0071E3]/25'
          : 'bg-[#5856D6]/12 text-[#5856D6] border border-[#5856D6]/25'
      } ${className}`}
    >
      {showIcon && (
        isMe ? (
          <User className="w-2.5 h-2.5 sm:w-3 sm:h-3 stroke-[2.5]" />
        ) : (
          <Users className="w-2.5 h-2.5 sm:w-3 sm:h-3 stroke-[2.5]" />
        )
      )}
      <span>Paid by {name}</span>
    </span>
  );
};
