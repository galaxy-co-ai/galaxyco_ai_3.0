'use client';

import { motion } from 'framer-motion';
import { ContentBlockRenderer } from './ContentBlockRenderer';
import type {
  ConversationMessage as MessageType,
  ActionOption,
} from '@/types/neptune-conversation';

interface ConversationMessageProps {
  message: MessageType;
  onAction?: (action: ActionOption) => void;
}

export function ConversationMessage({ message, onAction }: ConversationMessageProps) {
  const isNeptune = message.role === 'neptune';

  return (
    <motion.div
      data-role={message.role}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.2, 0, 0, 1] }}
      className={
        isNeptune
          ? 'space-y-2'
          : 'ml-auto max-w-[80%] rounded-xl bg-card px-4 py-2.5'
      }
    >
      {message.blocks.map((block, index) => (
        <motion.div
          key={`${message.id}-block-${index}`}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.3,
            delay: index * 0.1,
            ease: [0.2, 0, 0, 1],
          }}
        >
          <ContentBlockRenderer block={block} onAction={onAction} />
        </motion.div>
      ))}
    </motion.div>
  );
}
