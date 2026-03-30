'use client'

import { useState, useCallback, useId, useMemo } from 'react'
import Image from 'next/image'
import { useTranslations } from 'next-intl'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { getCachedImageUrl } from '@/lib/imageCache'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { HelpButton } from '@/presentation/components/atoms/HelpButton'
import { ConfirmDialog } from '@/presentation/components/molecules/ConfirmDialog'
import { AlbumArtFallback } from '@/presentation/components/atoms/AlbumArtFallback'
import { OnboardingTour } from '@/presentation/components/molecules/OnboardingTour'
import {
  saveDJBallotDraft,
  loadDJBallotDraft,
  clearDJBallotDraft,
} from '@/domain/voting/draftPersistence'
import { toast } from 'sonner'

export interface DJTrack {
  id: string
  title: string
  artist: string
  albumArtUrl?: string
}

interface SortableTrackItemProps {
  track: DJTrack
  position: number
}

function SortableTrackItem({ track, position }: SortableTrackItemProps) {
  const tDj = useTranslations('voting.djVote')
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: track.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : undefined,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-3 p-3 rounded-lg border border-border bg-card hover:border-primary/40 transition-colors"
      role="listitem"
    >
      {/* Drag handle */}
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground p-1 rounded focus:outline-none focus:ring-2 focus:ring-primary"
        aria-label={tDj('dragAriaLabel', { title: track.title })}
        type="button"
      >
        <GripVertical className="h-4 w-4" aria-hidden="true" />
      </button>

      {/* Position number */}
      <Badge variant="outline" className="w-7 h-7 flex items-center justify-center text-xs font-bold shrink-0">
        {position}
      </Badge>

      {/* Album art */}
      {track.albumArtUrl ? (
        <Image
          src={getCachedImageUrl(track.albumArtUrl, { width: 40, height: 40, fit: 'cover' }) ?? track.albumArtUrl}
          alt={tDj('albumArtAlt', { title: track.title })}
          width={40}
          height={40}
          className="w-10 h-10 rounded object-cover shrink-0"
        />
      ) : (
        <AlbumArtFallback size="w-10 h-10" />
      )}

      {/* Track info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{track.title}</p>
        <p className="text-xs text-muted-foreground truncate">{track.artist}</p>
      </div>
    </div>
  )
}

interface DJBallotDnDProps {
  /** Tracks to rank — already shuffled for fairness. */
  tracks: DJTrack[]
  /** Authenticated voter ID for draft persistence. */
  voterId: string
  /** Voting period ID for draft scoping. */
  periodId: string
  /** Called with the final ranked track IDs when the ballot is submitted. */
  onSubmit: (rankedTrackIds: string[]) => Promise<void>
}

/**
 * DJBallotDnD — Drag-and-drop ballot for DJ ranked-choice voting (Spec §5.2).
 *
 * Features:
 * - Sortable list using @dnd-kit/core + @dnd-kit/sortable
 * - Keyboard navigation via KeyboardSensor (accessibility §12)
 * - Real-time position numbers
 * - Draft persistence (pause & resume)
 * - ConfirmDialog before final submission
 * - HelpButton explaining Schulze method
 */
export function DJBallotDnD({ tracks, voterId, periodId, onSubmit }: DJBallotDnDProps) {
  const dndContextId = useId()
  const tDraft = useTranslations('voting.draft')
  const tTour = useTranslations('onboarding.djTour')
  const tDj = useTranslations('voting.djVote')

  const djTourSteps = useMemo(() => [
    { title: tTour('welcome'), description: tTour('welcomeDesc') },
    { title: tTour('dragDrop'), description: tTour('dragDropDesc') },
    { title: tTour('schulze'), description: tTour('schulzeDesc') },
    { title: tTour('submit'), description: tTour('submitDesc') },
  ], [tTour])

  // Load draft on first render if one exists
  const [orderedTracks, setOrderedTracks] = useState<DJTrack[]>(() => {
    const draft = loadDJBallotDraft(voterId, periodId)
    if (draft && draft.rankedTrackIds.length === tracks.length) {
      const trackMap = new Map(tracks.map((t) => [t.id, t]))
      const restored = draft.rankedTrackIds
        .map((id) => trackMap.get(id))
        .filter((t): t is DJTrack => t !== undefined)
      if (restored.length === tracks.length) return restored
    }
    return tracks
  })

  const [confirmOpen, setConfirmOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event
      if (over && active.id !== over.id) {
        setOrderedTracks((current) => {
          const oldIndex = current.findIndex((t) => t.id === active.id)
          const newIndex = current.findIndex((t) => t.id === over.id)
          return arrayMove(current, oldIndex, newIndex)
        })
      }
    },
    []
  )

  const handleSaveDraft = useCallback(() => {
    saveDJBallotDraft(voterId, {
      periodId,
      rankedTrackIds: orderedTracks.map((t) => t.id),
      savedAt: new Date().toISOString(),
    })
    toast.success(tDraft('saved'), {
      description: tDraft('savedDjDesc'),
    })
  }, [voterId, periodId, orderedTracks, tDraft])

  const handleConfirmSubmit = useCallback(async () => {
    setIsSubmitting(true)
    try {
      await onSubmit(orderedTracks.map((t) => t.id))
      clearDJBallotDraft(voterId, periodId)
    } finally {
      setIsSubmitting(false)
      setConfirmOpen(false)
    }
  }, [onSubmit, orderedTracks, voterId, periodId])

  if (tracks.length === 0) {
    return (
      <Card className="p-8 glassmorphism text-center">
        <p className="text-muted-foreground">{tDj('noTracks')}</p>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Onboarding tour for first-time visitors */}
      <OnboardingTour
        storageKey="dj-voting"
        steps={djTourSteps}
        skipLabel={tTour('skip')}
        nextLabel={tTour('next')}
        finishLabel={tTour('finish')}
      />

      {/* Header */}
      <div className="flex items-center gap-2 mb-2">
        <p className="text-sm text-muted-foreground">
          {tDj('dragInstruction')}
        </p>
        <HelpButton
          title={tDj('helpTitle')}
          description={tDj('helpText')}
          ariaLabel={tDj('helpAriaLabel')}
        />
      </div>

      {/* Sortable list */}
      <DndContext
        id={dndContextId}
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={orderedTracks.map((t) => t.id)}
          strategy={verticalListSortingStrategy}
        >
          <div role="list" aria-label={tDj('rankingAriaLabel')} className="space-y-2">
            {orderedTracks.map((track, index) => (
              <SortableTrackItem
                key={track.id}
                track={track}
                position={index + 1}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {/* Action buttons */}
      <div className="flex items-center gap-3 pt-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleSaveDraft}
          disabled={isSubmitting}
          aria-label={tDj('saveDraftAriaLabel')}
        >
          {tDraft('save')}
        </Button>

        <Button
          onClick={() => setConfirmOpen(true)}
          disabled={isSubmitting}
          aria-label={tDj('submitAriaLabel')}
        >
          {isSubmitting ? tDj('submitting') : tDj('submitBallot')}
        </Button>
      </div>

      {/* Submit confirmation */}
      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={tDj('submitBallot')}
        description={tDj('confirmDescription')}
        confirmLabel={tDj('confirmConfirm')}
        cancelLabel={tDj('confirmCancel')}
        onConfirm={handleConfirmSubmit}
      />
    </div>
  )
}
