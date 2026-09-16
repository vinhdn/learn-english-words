import type { CSSProperties } from 'react'
import {
  Angry, Apple, Armchair, Baby, Backpack, Bath, BedDouble, Bird, BookOpen, Cat, CircleDot,
  CookingPot, Dog, DoorOpen, Ear, Eraser, Eye, Fish, Footprints, Frown, GlassWater, Hand,
  Hash, Heart, House, LampDesk, Milk, Palette, Pencil, PersonStanding, Rabbit, Ruler, School,
  Smile, Sparkles, Turtle, UsersRound, Utensils, Waves,
  type LucideIcon,
} from 'lucide-react'
import type { LearningWord, WordCategory } from '../types'

const visualIcons: Record<string, LucideIcon> = {
  cat: Cat, dog: Dog, bird: Bird, fish: Fish, rabbit: Rabbit, turtle: Turtle, pig: CircleDot,
  apple: Apple, milk: Milk, water: GlassWater, rice: CookingPot, bread: Utensils, egg: CircleDot,
  cake: Sparkles, banana: Utensils, eyes: Eye, ears: Ear, hands: Hand, feet: Footprints,
  legs: Footprints, head: Smile, mouth: Smile, nose: Smile, happy: Smile, sad: Frown, angry: Angry,
  tired: BedDouble, hungry: Utensils, thirsty: GlassWater, house: House, bedroom: BedDouble,
  kitchen: CookingPot, bathroom: Bath, table: School, chair: Armchair, door: DoorOpen, lamp: LampDesk,
  book: BookOpen, pencil: Pencil, eraser: Eraser, ruler: Ruler, bag: Backpack, mom: Heart, dad: Heart,
  brother: UsersRound, sister: UsersRound, baby: Baby, family: UsersRound, run: PersonStanding,
  jump: PersonStanding, walk: Footprints, swim: Waves, eat: Utensils, drink: GlassWater,
  sleep: BedDouble, read: BookOpen, sit: Armchair, sun: Sparkles, cup: GlassWater, hat: CircleDot,
  bed: BedDouble, pen: Pencil, elephant: CircleDot, lion: CircleDot, monkey: CircleDot,
  tiger: Cat, frog: CircleDot, snake: Waves, bear: CircleDot, log: CircleDot,
}

const categoryIcons: Record<WordCategory, LucideIcon> = {
  phonics: Sparkles,
  colors: Palette,
  numbers: Hash,
  family: UsersRound,
  school: School,
  'sight-words': BookOpen,
  animals: Cat,
  food: Apple,
  body: PersonStanding,
  actions: PersonStanding,
  feelings: Smile,
  home: House,
}

interface WordIllustrationProps {
  word: LearningWord
  compact?: boolean
}

export function WordIllustration({ word, compact = false }: WordIllustrationProps) {
  const size = compact ? 58 : 112
  const style = { '--word-color': word.color } as CSSProperties

  if (word.visual === 'color') {
    return (
      <div className={`word-visual color-visual${compact ? ' compact' : ''}`} style={style} aria-label={`Màu ${word.english}`}>
        <span className="color-swatch" />
      </div>
    )
  }

  if (word.visual.startsWith('number-')) {
    const value = word.visual.replace('number-', '')
    return (
      <div className={`word-visual number-visual${compact ? ' compact' : ''}`} style={style} aria-label={`Số ${value}`}>
        <strong>{value}</strong>
        {!compact && <span className="number-dots" aria-hidden="true">{Array.from({ length: Math.min(Number(value), 10) }, (_, index) => <i key={index} />)}</span>}
      </div>
    )
  }

  if (word.visual === 'word' || ['in', 'on', 'this', 'that', 'have'].includes(word.visual)) {
    return (
      <div className={`word-visual sight-visual${compact ? ' compact' : ''}`} style={style} aria-hidden="true">
        <strong>{word.english.slice(0, 2)}</strong>
      </div>
    )
  }

  const Icon = visualIcons[word.visual] ?? categoryIcons[word.category]
  return (
    <div className={`word-visual icon-visual${compact ? ' compact' : ''}`} style={style} aria-hidden="true">
      <span className="visual-blob" />
      <Icon size={size} strokeWidth={1.8} />
      {!compact && <span className="visual-label" lang="en">{word.english}</span>}
    </div>
  )
}
