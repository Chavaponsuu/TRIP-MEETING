'use client'

import { useCallback } from 'react'
import { Comment } from '@/types'

export function useComments(
  appendComment: (comment: Comment) => void
) {
  const onCommentAdded = useCallback((comment: Comment) => {
    appendComment(comment)
  }, [appendComment])

  return { onCommentAdded }
}
