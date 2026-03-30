import { useState, useEffect, useMemo } from 'react'
import { useKV } from '@/lib/kv-shim'
import { CurrencyEur, Tag, TrendUp, Calculator, Sparkle, ListDashes } from '@phosphor-icons/react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import type { Band, Genre, Tier } from '@/lib/types'
import { calculateCategoryPrice, getTierFromListeners, simulateSpotifyListenersFetch } from '@/lib/voting'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import {
  type BillingCycle,
  compareBillingCycles,
  DEFAULT_YEARLY_DISCOUNT_PERCENT,
} from '@/domain/payment/tierPricing'

interface CategoryPricingProps {
  bandId: string
  /** Yearly discount percentage override (0–100). Defaults to 15. */
  yearlyDiscountPercent?: number
}

export function CategoryPricing({ bandId, yearlyDiscountPercent = DEFAULT_YEARLY_DISCOUNT_PERCENT }: CategoryPricingProps) {
  const [bands] = useKV<Band[]>('bands', [])
  const [selectedCategories, setSelectedCategories] = useState<Genre[]>(['Goth'])
  const [isCalculating, setIsCalculating] = useState(false)
  const [spotifyListeners, setSpotifyListeners] = useState<number | null>(null)
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('monthly')

  const band = bands?.find(b => b.id === bandId)

  useEffect(() => {
    if (band) {
      setSpotifyListeners(band.spotifyMonthlyListeners)
    }
  }, [band])

  const currentTier = (spotifyListeners
    ? getTierFromListeners(spotifyListeners)
    : band?.tier) ?? 'Micro'

  const comparison = useMemo(
    () => compareBillingCycles(currentTier, selectedCategories.length, yearlyDiscountPercent),
    [currentTier, selectedCategories.length, yearlyDiscountPercent],
  )

  const fetchSpotifyData = async () => {
    setIsCalculating(true)
    try {
      const listeners = await simulateSpotifyListenersFetch(bandId)
      setSpotifyListeners(listeners)
      toast.success('Spotify data updated', {
        description: `${listeners.toLocaleString()} monthly listeners`
      })
    } catch (_error) {
      toast.error('Failed to fetch Spotify data')
    } finally {
      setIsCalculating(false)
    }
  }

  const handleCategoryToggle = (category: Genre) => {
    setSelectedCategories(current => {
      if (current.includes(category)) {
        return current.filter(c => c !== category)
      }
      return [...current, category]
    })
  }

  if (!band) {
    return (
      <Card className="p-8 glassmorphism text-center">
        <p className="text-muted-foreground">Band not found</p>
      </Card>
    )
  }

  const pricePerCategory = calculateCategoryPrice(currentTier)

  const isYearly = billingCycle === 'yearly'
  const activePricing = isYearly ? comparison.yearly : comparison.monthly

  const costBreakdown = selectedCategories.map((category, idx) => ({
    category,
    price: idx === 0 ? 0 : pricePerCategory,
    isFree: idx === 0
  }))

  const getTierRange = (tier: Tier) => {
    switch (tier) {
      case 'Micro':         return '0 – 10,000'
      case 'Emerging':      return '10,001 – 50,000'
      case 'Established':   return '50,001 – 250,000'
      case 'International': return '250,001 – 1,000,000'
      case 'Macro':         return '> 1,000,000'
    }
  }

  const getTierColor = (tier: Tier) => {
    switch (tier) {
      case 'Micro':         return 'text-muted-foreground'
      case 'Emerging':      return 'text-accent'
      case 'Established':   return 'text-primary'
      case 'International': return 'text-destructive'
      case 'Macro':         return 'text-destructive'
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-bold tracking-tight mb-2">
            {band.name}
          </h2>
          <p className="text-sm text-muted-foreground">
            Category submission pricing calculator
          </p>
        </div>
        <Badge variant="outline" className={cn("gap-1 font-mono", getTierColor(currentTier))}>
          {currentTier} Tier
        </Badge>
      </div>

      <Card className="p-4 glassmorphism">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <TrendUp className="w-6 h-6 text-accent" weight="duotone" />
            <div>
              <p className="text-xs text-muted-foreground">Spotify Monthly Listeners</p>
              <p className="text-2xl font-mono font-bold">
                {spotifyListeners ? spotifyListeners.toLocaleString() : '—'}
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchSpotifyData}
            disabled={isCalculating}
            className="gap-2"
          >
            {isCalculating ? (
              <>
                <Sparkle className="w-4 h-4 animate-spin" />
                Fetching...
              </>
            ) : (
              <>
                <TrendUp className="w-4 h-4" />
                Refresh
              </>
            )}
          </Button>
        </div>

        <Separator className="my-4" />

        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 bg-secondary/30 rounded">
            <p className="text-xs text-muted-foreground mb-1">Current Tier</p>
            <p className={cn("text-lg font-mono font-bold", getTierColor(currentTier))}>
              {currentTier}
            </p>
          </div>

          <div className="p-3 bg-secondary/30 rounded">
            <p className="text-xs text-muted-foreground mb-1">Listener Range</p>
            <p className="text-sm font-mono">
              {getTierRange(currentTier)}
            </p>
          </div>
        </div>
      </Card>

      <Card className="p-4 glassmorphism">
        <div className="flex items-center gap-2 mb-4">
          <Tag className="w-5 h-5 text-primary" />
          <h3 className="font-display font-semibold text-lg">Select Categories</h3>
        </div>

        <div className="space-y-3">
          {(['Goth', 'Metal', 'Dark Electro'] as Genre[]).map((category, idx) => (
            <div
              key={category}
              className={cn(
                "flex items-center justify-between p-4 rounded border transition-all",
                selectedCategories.includes(category)
                  ? "bg-primary/10 border-primary/30"
                  : "bg-secondary/20 border-border hover:border-primary/20"
              )}
            >
              <div className="flex items-center gap-3">
                <Checkbox
                  id={`category-${category}`}
                  checked={selectedCategories.includes(category)}
                  onCheckedChange={() => handleCategoryToggle(category)}
                />
                <Label
                  htmlFor={`category-${category}`}
                  className="cursor-pointer font-medium"
                >
                  {category}
                </Label>
                {idx === 0 && (
                  <Badge variant="secondary" className="text-xs">
                    1st free
                  </Badge>
                )}
              </div>
              <div className="text-right">
                <p className={cn(
                  "text-lg font-mono font-bold",
                  idx === 0 ? "text-accent" : "text-foreground"
                )}>
                  {idx === 0 ? 'FREE' : `€${pricePerCategory}`}
                </p>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-6 glassmorphism bg-accent/5 border-accent/30">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <Calculator className="w-7 h-7 text-accent" weight="duotone" />
            <div>
              <h3 className="font-display text-xl font-semibold">Cost Breakdown</h3>
              <p className="text-xs text-muted-foreground">
                {selectedCategories.length} {selectedCategories.length === 1 ? 'category' : 'categories'} selected
              </p>
            </div>
          </div>
        </div>

        {/* Billing Cycle Toggle */}
        <div className="flex items-center justify-between p-3 mb-4 rounded bg-secondary/30">
          <div className="flex items-center gap-2">
            <Label htmlFor="billing-cycle-toggle" className="text-sm font-medium cursor-pointer">
              Monthly
            </Label>
            <Switch
              id="billing-cycle-toggle"
              checked={isYearly}
              onCheckedChange={(checked) => setBillingCycle(checked ? 'yearly' : 'monthly')}
              aria-label="Toggle yearly billing"
            />
            <Label htmlFor="billing-cycle-toggle" className="text-sm font-medium cursor-pointer">
              Yearly
            </Label>
          </div>
          {isYearly && comparison.yearlySavingsCents > 0 && (
            <Badge variant="default" className="bg-accent text-accent-foreground gap-1">
              Save {yearlyDiscountPercent}%
            </Badge>
          )}
        </div>

        {selectedCategories.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-8 text-center">
            <ListDashes className="w-10 h-10 text-muted-foreground/40" weight="duotone" />
            <p className="text-sm text-muted-foreground">
              Select at least one category to see pricing.
            </p>
            <span className="text-2xl font-mono font-bold text-muted-foreground">€0.00</span>
          </div>
        ) : (
        <>
        <div className="space-y-2 mb-4">
          {costBreakdown.map((item) => (
            <div key={item.category} className="flex justify-between items-center py-2">
              <span className="text-sm font-medium">{item.category}</span>
              <span className={cn(
                "font-mono font-bold",
                item.isFree ? "text-accent" : "text-foreground"
              )}>
                {item.isFree ? 'FREE' : `€${item.price}.00`}
              </span>
            </div>
          ))}
        </div>

        <Separator className="my-4" />

        <div className="flex justify-between items-center">
          <span className="font-display text-lg font-semibold">
            {isYearly ? 'Total Yearly Cost' : 'Total Monthly Cost'}
          </span>
          <div className="flex items-center gap-2">
            <CurrencyEur className="w-6 h-6 text-accent" weight="bold" />
            <span className="text-3xl font-mono font-bold text-accent">
              {activePricing.totalEur}
            </span>
          </div>
        </div>

        {/* Yearly vs Monthly comparison */}
        {isYearly && comparison.yearlySavingsCents > 0 && (
          <div className="mt-3 p-3 rounded bg-accent/10 border border-accent/20">
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">Monthly × 12 (no discount)</span>
              <span className="font-mono text-muted-foreground line-through">
                €{(comparison.monthly.totalCents * 12 / 100).toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between items-center text-sm mt-1">
              <span className="text-accent font-medium">You save per year</span>
              <span className="font-mono font-bold text-accent">
                €{comparison.yearlySavingsEur}
              </span>
            </div>
          </div>
        )}

        {!isYearly && comparison.yearlySavingsCents > 0 && (
          <div className="mt-3 p-3 rounded bg-secondary/20 border border-border text-sm">
            <p className="text-muted-foreground">
              💰 Switch to yearly billing and{' '}
              <button
                type="button"
                className="text-accent font-semibold underline underline-offset-2 hover:text-accent/80"
                onClick={() => setBillingCycle('yearly')}
              >
                save €{comparison.yearlySavingsEur}/year ({yearlyDiscountPercent}% off)
              </button>
            </p>
          </div>
        )}
        </>
        )}

        <div className="mt-4 p-3 bg-secondary/20 rounded text-xs text-muted-foreground">
          <p>
            💡 <strong className="text-foreground">Fair Pricing:</strong> Your tier is automatically 
            calculated from Spotify listeners. Established bands subsidize newcomers, keeping the 
            first category free for everyone.
          </p>
        </div>
      </Card>

      <Card className="p-4 glassmorphism bg-secondary/20">
        <h4 className="font-semibold mb-3 text-sm">Pricing Structure</h4>
        <div className="space-y-2 text-xs text-muted-foreground">
          <div className="flex justify-between">
            <span>• Micro Tier (0 – 10k listeners)</span>
            <span className="font-mono">€5 / additional category</span>
          </div>
          <div className="flex justify-between">
            <span>• Emerging Tier (10k – 50k)</span>
            <span className="font-mono">€15 / additional category</span>
          </div>
          <div className="flex justify-between">
            <span>• Established Tier (50k – 250k)</span>
            <span className="font-mono">€35 / additional category</span>
          </div>
          <div className="flex justify-between">
            <span>• International Tier (250k – 1M)</span>
            <span className="font-mono">€75 / additional category</span>
          </div>
          <div className="flex justify-between">
            <span>• Macro Tier (&gt;1M listeners)</span>
            <span className="font-mono">€150 / additional category</span>
          </div>
        </div>
      </Card>

      <Button
        size="lg"
        className="w-full gap-2"
        disabled={selectedCategories.length === 0}
      >
        <CurrencyEur className="w-5 h-5" />
        Submit for €{activePricing.totalEur}/{isYearly ? 'year' : 'month'}
      </Button>
    </div>
  )
}
