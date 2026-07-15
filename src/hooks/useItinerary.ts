'use client'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ItineraryItem, ItineraryItemType, ItineraryItemStatus, ReactionType } from '@/types'

interface CreateItemInput {
  day_number?: number | null
  item_type: ItineraryItemType
  title: string
  description?: string | null
  start_time?: string | null
  end_time?: string | null
  location?: string | null
}

export function useItinerary(tripId: string) {
  const [items, setItems] = useState<ItineraryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const supabase = useMemo(() => createClient(), [])
  const channelId = useRef(`itinerary-${tripId}-${Math.random().toString(36).slice(2, 8)}`)

  const fetchItems = useCallback(async () => {
    const { data, error: fetchError } = await supabase
      .from('itinerary_items')
      .select(`
        id, trip_id, day_number, item_type, title, description,
        start_time, end_time, location, status, display_order,
        created_by, created_at, updated_at,
        creator:profiles!itinerary_items_created_by_fkey(id, name, avatar_color),
        reactions:itinerary_reactions(
          id, itinerary_item_id, user_id, reaction_type, created_at,
          user:profiles(id, name, avatar_color)
        ),
        comments:itinerary_comments(
          id, itinerary_item_id, user_id, text, created_at,
          user:profiles(id, name, avatar_color)
        )
      `)
      .eq('trip_id', tripId)
      .order('day_number', { nullsFirst: false, ascending: true })
      .order('start_time', { nullsFirst: false, ascending: true })
      .order('display_order', { ascending: true })

    if (fetchError) {
      setError('โหลดกำหนดการเดินทางไม่สำเร็จ')
      setLoading(false)
      return
    }

    setItems((data ?? []) as unknown as ItineraryItem[])
    setLoading(false)
  }, [tripId, supabase])

  const fetchItemsRef = useRef(fetchItems)
  useEffect(() => { fetchItemsRef.current = fetchItems }, [fetchItems])

  // Initial fetch
  useEffect(() => {
    setLoading(true)
    setError(null)
    fetchItems()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tripId])

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel(channelId.current)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'itinerary_items', filter: `trip_id=eq.${tripId}` },
        () => fetchItemsRef.current()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'itinerary_reactions' },
        () => fetchItemsRef.current()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'itinerary_comments' },
        () => fetchItemsRef.current()
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tripId])

  // Mutations
  const createItem = useCallback(async (input: CreateItemInput): Promise<{ data: ItineraryItem | null; error: string | null }> => {
    if (!input.title.trim()) {
      return { data: null, error: 'กรุณากรอกหัวข้อกิจกรรม' }
    }
    if (input.start_time && input.end_time && input.end_time <= input.start_time) {
      return { data: null, error: 'เวลาสิ้นสุดต้องมากกว่าเวลาเริ่มต้น' }
    }

    const dayItems = items.filter(item => item.day_number === input.day_number)
    const nextOrder = dayItems.length > 0 ? Math.max(...dayItems.map(i => i.display_order)) + 1 : 0

    const { data, error: createError } = await supabase
      .from('itinerary_items')
      .insert({
        trip_id: tripId,
        day_number: input.day_number ?? null,
        item_type: input.item_type,
        title: input.title,
        description: input.description ?? null,
        start_time: input.start_time ?? null,
        end_time: input.end_time ?? null,
        location: input.location ?? null,
        status: 'proposed',
        display_order: nextOrder
      })
      .select()
      .single()

    if (createError) {
      return { data: null, error: 'สร้างกิจกรรมไม่สำเร็จ' }
    }

    await fetchItems()
    const created = items.find(i => i.id === data.id) ?? null
    return { data: created, error: null }
  }, [tripId, supabase, items, fetchItems])

  const updateItemStatus = useCallback(async (itemId: string, status: ItineraryItemStatus): Promise<{ error: string | null }> => {
    const { error: updateError } = await supabase
      .from('itinerary_items')
      .update({ status })
      .eq('id', itemId)

    if (updateError) {
      return { error: 'อัปเดตสถานะไม่สำเร็จ' }
    }
    return { error: null }
  }, [supabase])

  const deleteItem = useCallback(async (itemId: string): Promise<{ error: string | null }> => {
    const { error: deleteError } = await supabase
      .from('itinerary_items')
      .delete()
      .eq('id', itemId)

    if (deleteError) {
      return { error: 'ลบกิจกรรมไม่สำเร็จ' }
    }
    return { error: null }
  }, [supabase])

  const reorderItems = useCallback(async (reordered: { id: string; display_order: number }[]): Promise<{ error: string | null }> => {
    for (const update of reordered) {
      const { error: updateError } = await supabase
        .from('itinerary_items')
        .update({ display_order: update.display_order })
        .eq('id', update.id)
      
      if (updateError) {
        return { error: 'จัดลำดับกิจกรรมไม่สำเร็จ' }
      }
    }
    await fetchItems()
    return { error: null }
  }, [supabase, fetchItems])

  const addReaction = useCallback(async (itemId: string, reactionType: ReactionType): Promise<{ error: string | null }> => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'กรุณาเข้าสู่ระบบ' }

    const { error: reactionError } = await supabase
      .from('itinerary_reactions')
      .upsert(
        { itinerary_item_id: itemId, user_id: user.id, reaction_type: reactionType },
        { onConflict: 'itinerary_item_id,user_id' }
      )

    if (reactionError) {
      return { error: 'ส่งรีแอคชันไม่สำเร็จ' }
    }
    return { error: null }
  }, [supabase])

  const removeReaction = useCallback(async (itemId: string): Promise<{ error: string | null }> => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'กรุณาเข้าสู่ระบบ' }

    const { error: deleteError } = await supabase
      .from('itinerary_reactions')
      .delete()
      .eq('itinerary_item_id', itemId)
      .eq('user_id', user.id)

    if (deleteError) {
      return { error: 'ลบรีแอคชันไม่สำเร็จ' }
    }
    return { error: null }
  }, [supabase])

  const addComment = useCallback(async (itemId: string, text: string): Promise<{ error: string | null }> => {
    if (!text.trim()) return { error: 'ความคิดเห็นห้ามว่าง' }

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'กรุณาเข้าสู่ระบบ' }

    const { error: commentError } = await supabase
      .from('itinerary_comments')
      .insert({ itinerary_item_id: itemId, user_id: user.id, text })

    if (commentError) {
      return { error: 'แสดงความคิดเห็นไม่สำเร็จ' }
    }
    return { error: null }
  }, [supabase])

  return {
    items,
    loading,
    error,
    refetch: fetchItems,
    createItem,
    updateItemStatus,
    deleteItem,
    reorderItems,
    addReaction,
    removeReaction,
    addComment
  }
}
