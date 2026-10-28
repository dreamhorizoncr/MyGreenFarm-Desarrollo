import { useEffect, useRef } from 'react'
import { useAccessibility } from '../../contexts/accessibility'

export type ChickState = 'idle' | 'listening' | 'thinking' | 'speaking'
export type ChickMood = 'neutral' | 'happy' | 'worried'
export type ChickReaction = 'thanks' | 'point' | 'shake' | 'nod' | 'tickle' | 'bye'

interface ChickAvatarProps {
  state?: ChickState
  mood?: ChickMood
  talkTick?: number
  jumpKey?: number
  waving?: boolean
  inputDirection?: 'up' | 'down'
  reaction?: { type: ChickReaction; key: number } | null
  size?: number
  className?: string
  label?: string
}

interface Motion {
  wobble: number
  speed: number
  bob: number
  tilt: number
  sway: number
  flap: number
  dots: number
  squash: number
  idle: number
  gaze: number
  lookX: number
  lookY: number
  flapRate: number
  swayRate: number
}

type IdleAction = 'preen' | 'stretch' | 'look' | 'peck'

const POINTS = 10
const CENTER = { x: 50, y: 56 }
const RADIUS = { x: 28, y: 27 }
const GROUND = 84
const SLEEP_AFTER = 25
const EYE_Y = 51

const STATE_MOTION: Record<ChickState, Motion> = {
  idle: {
    wobble: 0.5,
    speed: 1.4,
    bob: 1.6,
    tilt: 0,
    sway: 3,
    flap: 0,
    dots: 0,
    squash: 0.03,
    idle: 1,
    gaze: 0,
    lookX: 0,
    lookY: 0,
    flapRate: 4,
    swayRate: 1.1,
  },
  listening: {
    wobble: 0,
    speed: 1.4,
    bob: 0,
    tilt: 8,
    sway: 0,
    flap: 32,
    dots: 0,
    squash: 0,
    idle: 0,
    gaze: 0,
    lookX: 0.6,
    lookY: 2,
    flapRate: 9,
    swayRate: 1.1,
  },
  thinking: {
    wobble: 1.6,
    speed: 1.6,
    bob: 0.8,
    tilt: 0,
    sway: 10,
    flap: 4,
    dots: 1,
    squash: 0.02,
    idle: 0,
    gaze: 1,
    lookX: 0,
    lookY: -2,
    flapRate: 4,
    swayRate: 1.6,
  },
  speaking: {
    wobble: 0,
    speed: 1.4,
    bob: 0,
    tilt: 0,
    sway: 0,
    flap: 0,
    dots: 0,
    squash: 0,
    idle: 0,
    gaze: 0,
    lookX: 0,
    lookY: 0,
    flapRate: 4,
    swayRate: 1.1,
  },
}

const MOTION_KEYS = Object.keys(STATE_MOTION.idle) as (keyof Motion)[]
const IDLE_ACTIONS: { type: IdleAction; duration: number }[] = [
  { type: 'preen', duration: 1.3 },
  { type: 'stretch', duration: 1.1 },
  { type: 'look', duration: 1.8 },
  { type: 'peck', duration: 1.4 },
]
const REACTIONS: ChickReaction[] = ['thanks', 'point', 'shake', 'nod', 'tickle', 'bye']
const HEART_PATH = 'M0,2.5 C-4,-1 -2.5,-4.5 0,-2 C2.5,-4.5 4,-1 0,2.5 Z'

function blobPath(phase: number, wobble: number) {
  const points = Array.from({ length: POINTS }, (_, index) => {
    const angle = (index / POINTS) * Math.PI * 2
    const wave = Math.sin(phase * 1.3 + index * 1.7) * wobble
    const flatBottom = Math.sin(angle) > 0.6 ? 0.92 : 1
    return {
      x: CENTER.x + Math.cos(angle) * (RADIUS.x + wave),
      y: CENTER.y + Math.sin(angle) * (RADIUS.y * flatBottom + wave),
    }
  })

  let path = `M${points[0].x.toFixed(2)},${points[0].y.toFixed(2)}`
  for (let index = 0; index < POINTS; index++) {
    const p0 = points[(index - 1 + POINTS) % POINTS]
    const p1 = points[index]
    const p2 = points[(index + 1) % POINTS]
    const p3 = points[(index + 2) % POINTS]
    const c1 = { x: p1.x + (p2.x - p0.x) / 6, y: p1.y + (p2.y - p0.y) / 6 }
    const c2 = { x: p2.x - (p3.x - p1.x) / 6, y: p2.y - (p3.y - p1.y) / 6 }
    path += ` C${c1.x.toFixed(2)},${c1.y.toFixed(2)} ${c2.x.toFixed(2)},${c2.y.toFixed(2)} ${p2.x.toFixed(2)},${p2.y.toFixed(2)}`
  }
  return `${path}Z`
}

function hopOffset(time: number, every: number) {
  const phase = time % every
  if (phase > 0.55) return { lift: 0, squash: 0 }
  if (phase < 0.12) return { lift: 0, squash: (phase / 0.12) * 0.12 }
  const air = (phase - 0.12) / 0.43
  return {
    lift: Math.sin(air * Math.PI) * 9,
    squash: air > 0.85 ? ((air - 0.85) / 0.15) * 0.08 : -0.06,
  }
}

function jawEnvelope(elapsed: number) {
  if (elapsed < 0) return 0
  if (elapsed < 0.06) return Math.sin((elapsed / 0.06) * (Math.PI / 2))
  if (elapsed < 0.22) return Math.cos(((elapsed - 0.06) / 0.16) * (Math.PI / 2))
  return 0
}

function plateau(elapsed: number, duration: number, edge: number) {
  if (elapsed < 0 || elapsed > duration) return 0
  const rise = Math.min(1, elapsed / edge, (duration - elapsed) / edge)
  return rise * rise * (3 - 2 * rise)
}

function bump(progress: number, from: number, width: number) {
  if (progress < from || progress > from + width) return 0
  return Math.sin(((progress - from) / width) * Math.PI)
}

function clamp01(value: number) {
  return Math.min(1, Math.max(0, value))
}

const writtenAttributes = new WeakMap<Element, Map<string, string>>()

function setAttr(element: Element | null | undefined, name: string, value: string) {
  if (!element) return
  let written = writtenAttributes.get(element)
  if (!written) {
    written = new Map()
    writtenAttributes.set(element, written)
  }
  if (written.get(name) === value) return
  written.set(name, value)
  element.setAttribute(name, value)
}

function envelope(elapsed: number, duration: number) {
  if (elapsed < 0 || elapsed > duration) return 0
  return Math.sin((elapsed / duration) * Math.PI)
}

function approach(value: number, target: number, ease: number) {
  const diff = target - value
  return Math.abs(diff) < 0.005 ? target : value + diff * ease
}

const SPRING_STEP = 1 / 60

function spring(item: { x: number; v: number }, target: number, dt: number, stiffness: number, damping: number) {
  let remaining = dt
  while (remaining > 0) {
    const step = Math.min(SPRING_STEP, remaining)
    item.v += ((target - item.x) * stiffness - item.v * damping) * step
    item.x += item.v * step
    remaining -= step
  }
  return item.x
}

function ChickAvatar({
  state = 'idle',
  mood = 'neutral',
  talkTick = 0,
  jumpKey = 0,
  waving = false,
  inputDirection = 'down',
  reaction = null,
  size = 64,
  className = '',
  label,
}: Readonly<ChickAvatarProps>) {
  const svgRef = useRef<SVGSVGElement>(null)
  const bodyRef = useRef<SVGPathElement>(null)
  const groupRef = useRef<SVGGElement>(null)
  const airRef = useRef<SVGGElement>(null)
  const shadowRef = useRef<SVGEllipseElement>(null)
  const leftFootRef = useRef<SVGPathElement>(null)
  const rightFootRef = useRef<SVGPathElement>(null)
  const leftWingRef = useRef<SVGPathElement>(null)
  const rightWingRef = useRef<SVGPathElement>(null)
  const upperBeakRef = useRef<SVGPathElement>(null)
  const lowerBeakRef = useRef<SVGPathElement>(null)
  const mouthRef = useRef<SVGPathElement>(null)
  const tongueRef = useRef<SVGEllipseElement>(null)
  const lookRef = useRef<SVGGElement>(null)
  const eyesRef = useRef<SVGGElement>(null)
  const happyEyesRef = useRef<SVGPathElement>(null)
  const sleepEyesRef = useRef<SVGPathElement>(null)
  const browsRef = useRef<SVGPathElement>(null)
  const dotsRef = useRef<SVGGElement>(null)
  const zzzRef = useRef<SVGGElement>(null)
  const blushRef = useRef<SVGGElement>(null)
  const heartsRef = useRef<SVGGElement>(null)
  const featherRef = useRef<SVGGElement>(null)
  const seedsRef = useRef<SVGGElement>(null)
  const bubbleRef = useRef<SVGGElement>(null)
  const { stopAnimations } = useAccessibility()
  const propsRef = useRef({
    state,
    mood,
    talkTick,
    jumpKey,
    waving,
    inputDirection,
    reaction,
  })

  useEffect(() => {
    propsRef.current = {
      state,
      mood,
      talkTick,
      jumpKey,
      waving,
      inputDirection,
      reaction,
    }
  }, [state, mood, talkTick, jumpKey, waving, inputDirection, reaction])

  useEffect(() => {
    const svg = svgRef.current
    if (!svg) return
    const reduceMotion = stopAnimations || window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const current: Motion = { ...STATE_MOTION.idle }
    const phases = { body: 0, flap: 0, sway: 0 }
    const tiltSpring = { x: 0, v: 0 }
    const lookSpring = { x: { x: 0, v: 0 }, y: { x: 0, v: 0 } }
    const weights = { happy: 0, worried: 0, sleep: 0, wave: 0 }
    const pointer = { x: 0, y: 0, active: false }
    const seen = {
      talkTick: propsRef.current.talkTick,
      jumpKey: propsRef.current.jumpKey,
      mood: propsRef.current.mood,
      reactionKey: 0,
    }
    const reactions = Object.fromEntries(REACTIONS.map((type) => [type, -10])) as Record<ChickReaction, number>
    let featherAt = -10
    let lastHopLift = 0
    let syllableAt = -10
    let syllableStrength = 0.6
    let jumpAt = -10
    let frameInterval = 1 / 60
    let lastDraw = -1
    let lastActivity = 0
    let action: { type: IdleAction; start: number; duration: number } | null = null
    let nextAction = 6
    let nextBlink = 1.2
    let lastTime = 0
    let frame = 0
    let visible = true
    const start = performance.now()
    const clock = () => (performance.now() - start) / 1000

    const draw = (time: number) => {
      const props = propsRef.current
      const dt = Math.min(0.15, Math.max(0, time - lastTime))
      lastTime = time

      if (props.talkTick !== seen.talkTick) {
        const letters = props.talkTick - seen.talkTick
        syllableStrength = letters > 0 ? Math.min(1, Math.max(0.45, letters / 7)) : 0.6
        seen.talkTick = props.talkTick
        syllableAt = time
      }
      if (props.jumpKey !== seen.jumpKey) {
        seen.jumpKey = props.jumpKey
        jumpAt = time
        lastActivity = time
      }
      if (props.mood !== seen.mood) {
        if (props.mood === 'happy') jumpAt = time
        seen.mood = props.mood
      }
      if (props.reaction && props.reaction.key !== seen.reactionKey) {
        seen.reactionKey = props.reaction.key
        reactions[props.reaction.type] = time
        lastActivity = time
      }
      if (props.state !== 'idle' || props.waving) lastActivity = time

      const since = (type: ChickReaction) => time - reactions[type]
      const thanks = plateau(since('thanks'), 2.4, 0.35)
      const pointing = plateau(since('point'), 1.9, 0.3)
      const shakeTime = since('shake')
      const shakeTilt = shakeTime >= 0 && shakeTime < 0.9 ? Math.sin(shakeTime * 22) * 12 * (1 - shakeTime / 0.9) : 0
      const nod = envelope(since('nod'), 0.45)
      const tickleTime = since('tickle')
      const tickleFade = tickleTime >= 0 && tickleTime < 1.3 ? 1 - tickleTime / 1.3 : 0
      const tickleTilt = Math.sin(tickleTime * 38) * 7 * tickleFade
      const tickleAir = Math.abs(Math.sin(tickleTime * 14)) * 3 * tickleFade
      const goodbye = plateau(since('bye'), 2, 0.25)
      const bubble = plateau(tickleTime, 1.5, 0.15)

      const ease = 1 - Math.pow(0.92, dt * 60)
      const target = STATE_MOTION[props.state]
      for (const key of MOTION_KEYS) current[key] = approach(current[key], target[key], ease)
      const sleeping = props.state === 'idle' && time - lastActivity > SLEEP_AFTER
      weights.sleep = approach(weights.sleep, sleeping ? 1 : 0, ease * 0.5)
      weights.happy = approach(weights.happy, props.mood === 'happy' || tickleFade > 0 || thanks > 0 || goodbye > 0 ? 1 : 0, ease)
      weights.worried = approach(weights.worried, props.mood === 'worried' ? 1 : 0, ease)
      weights.wave = approach(weights.wave, (props.waving || goodbye > 0) && !sleeping ? 1 : 0, ease)
      const awake = 1 - weights.sleep

      if (current.idle > 0.95 && !sleeping && !action && time > nextAction && time - lastActivity < SLEEP_AFTER - 3.5) {
        const pick = IDLE_ACTIONS[Math.floor(Math.random() * IDLE_ACTIONS.length)]
        action = { type: pick.type, start: time, duration: pick.duration }
      }
      if (action && (time - action.start > action.duration || current.idle < 0.5 || sleeping)) {
        action = null
        nextAction = time + 5 + Math.random() * 4
      }
      const actionWeight = action ? envelope(time - action.start, action.duration) * current.idle : 0
      const actionProgress = action ? (time - action.start) / action.duration : 0

      phases.body += dt * current.speed * (1 - weights.sleep * 0.6)
      phases.flap += dt * current.flapRate
      phases.sway += dt * current.swayRate

      const jump = envelope(time - jumpAt, 0.45)
      const hop = hopOffset(time, 4.2)
      const hopWeight = current.idle * awake * (1 - weights.wave)
      const stretch = action?.type === 'stretch' ? actionWeight : 0
      const peck = action?.type === 'peck' ? Math.max(bump(actionProgress, 0.18, 0.22), bump(actionProgress, 0.56, 0.22)) : 0
      const yawn = props.state === 'idle' ? envelope(time - lastActivity - (SLEEP_AFTER - 2.4), 2.2) : 0

      if (lastHopLift > 0.5 && hop.lift === 0 && hopWeight > 0.5 && time - featherAt > 2.6 && Math.random() < 0.45) featherAt = time
      lastHopLift = hop.lift

      const air = hop.lift * hopWeight + jump * 10 + tickleAir
      const lift =
        ((1 - Math.cos(phases.body * 2.8)) / 2) * current.bob * awake - weights.worried * 1.5 - weights.sleep * 1 - peck * 5 - nod * 2.5
      const squash =
        Math.sin(phases.body * 2.8) * current.squash +
        hop.squash * hopWeight -
        jump * 0.06 -
        stretch * 0.09 +
        peck * 0.07 -
        yawn * 0.04 +
        weights.sleep * 0.04 * (1 + Math.sin(time * 1.6))

      const preenTilt = action?.type === 'preen' ? actionWeight * 12 : 0
      const tiltTarget = current.tilt * (1 - weights.worried) + Math.sin(phases.sway) * current.sway * awake + preenTilt + weights.sleep * 6 + pointing * 6
      const tilt = spring(tiltSpring, tiltTarget, dt, 140, 13) + shakeTilt + tickleTilt
      const scaleY = 1 - squash
      const scaleX = 1 + squash * 0.7
      setAttr(groupRef.current, 
        'transform',
        `translate(0 ${(-lift).toFixed(2)}) rotate(${tilt.toFixed(2)} 50 ${GROUND}) translate(50 ${GROUND}) scale(${scaleX.toFixed(3)} ${scaleY.toFixed(3)}) translate(-50 -${GROUND})`,
      )
      setAttr(bodyRef.current, 'd', blobPath(phases.body, current.wobble * awake))

      const airborne = Math.min(1, air / 10)
      setAttr(airRef.current, 'transform', `translate(0 ${(-air).toFixed(2)})`)
      setAttr(leftFootRef.current, 'transform', `rotate(${(airborne * 16).toFixed(2)} 42 83)`)
      setAttr(rightFootRef.current, 'transform', `rotate(${(-airborne * 16).toFixed(2)} 58 83)`)
      setAttr(shadowRef.current, 'transform', `translate(50 91) scale(${(1 - airborne * 0.35).toFixed(3)}) translate(-50 -91)`)
      setAttr(shadowRef.current, 'opacity', (1 - airborne * 0.5).toFixed(2))

      const baseFlap = -((1 - Math.cos(phases.flap)) / 2) * current.flap * (1 - weights.worried)
      const preenFlap = action?.type === 'preen' ? -Math.abs(Math.sin(actionProgress * Math.PI * 6)) * 30 * actionWeight : 0
      const stretchFlap = -stretch * 45
      const waveFlap = -(45 + Math.sin(time * 12) * 22) * weights.wave
      const droop = weights.worried * 20 + weights.sleep * 8
      const right = baseFlap + preenFlap + stretchFlap + waveFlap + droop + pointing * 55
      const left = baseFlap + stretchFlap + droop
      setAttr(rightWingRef.current, 'transform', `rotate(${right.toFixed(2)} 74 56)`)
      setAttr(leftWingRef.current, 'transform', `rotate(${(-left).toFixed(2)} 26 56)`)

      const open = Math.max(jawEnvelope(time - syllableAt) * syllableStrength, yawn * 1.2) * (1 - weights.sleep)
      const drop = open * 6
      const upperTip = 61.6 - open * 0.6
      const lowerInner = 58.6 + drop * 0.85
      const lowerTip = 62.4 + drop
      setAttr(upperBeakRef.current, 'd', `M45,57 Q50,55.6 55,57 L50,${upperTip.toFixed(2)} Z`)
      setAttr(lowerBeakRef.current, 'd', `M45.6,57.4 L50,${lowerInner.toFixed(2)} L54.4,57.4 L50,${lowerTip.toFixed(2)} Z`)
      setAttr(mouthRef.current, 'd', `M45.3,57.2 L50,${upperTip.toFixed(2)} L54.7,57.2 L50,${(lowerInner + 0.4).toFixed(2)} Z`)
      setAttr(mouthRef.current, 'opacity', open > 0.04 ? '1' : '0')
      setAttr(tongueRef.current, 'cy', (lowerInner - 1.1).toFixed(2))
      setAttr(tongueRef.current, 'opacity', Math.min(1, Math.max(0, (drop - 1.5) / 2)).toFixed(2))

      let follow = { x: 0, y: 0 }
      if (pointer.active) {
        const dx = pointer.x
        const dy = pointer.y
        const distance = Math.hypot(dx, dy) || 1
        const reach = Math.min(1, distance / 160)
        follow = {
          x: (dx / distance) * 2.4 * reach,
          y: (dy / distance) * 1.8 * reach,
        }
      }
      const glance = action?.type === 'look' ? Math.sin(actionProgress * Math.PI * 2) * 2.6 * actionWeight : 0
      const towardInput = props.inputDirection === 'up' ? -1 : 1
      const lookTarget = {
        x: current.lookX + Math.cos(time * 2) * 2.2 * current.gaze + (follow.x + glance) * current.idle * awake * (1 - pointing) + pointing * 2,
        y:
          current.lookY * (current.lookY > 0 ? towardInput : 1) +
          Math.sin(time * 2) * 0.8 * current.gaze +
          follow.y * current.idle * awake * (1 - pointing) +
          pointing * 2 * towardInput +
          nod * 1.6 * towardInput +
          peck * 2,
      }
      const lookX = spring(lookSpring.x, lookTarget.x, dt, 220, 18)
      const lookY = spring(lookSpring.y, lookTarget.y, dt, 220, 18)
      setAttr(lookRef.current, 'transform', `translate(${lookX.toFixed(2)} ${lookY.toFixed(2)})`)

      const special = Math.max(weights.happy, weights.sleep)
      let blinkScale = 1
      if (time > nextBlink) {
        const blink = time - nextBlink
        blinkScale = blink < 0.07 ? 1 - blink / 0.07 : Math.min(1, (blink - 0.07) / 0.07)
        if (blink > 0.14) nextBlink = time + 2.2 + Math.random() * 2.5
      }
      const eyeScale = Math.min(blinkScale, 1 - yawn * 0.65)
      setAttr(eyesRef.current, 'transform', `translate(0 ${EYE_Y}) scale(1 ${Math.max(0.1, eyeScale).toFixed(2)}) translate(0 -${EYE_Y})`)
      setAttr(eyesRef.current, 'opacity', (1 - special).toFixed(2))
      setAttr(happyEyesRef.current, 'opacity', (weights.happy * awake).toFixed(2))
      setAttr(sleepEyesRef.current, 'opacity', weights.sleep.toFixed(2))
      setAttr(browsRef.current, 'opacity', weights.worried.toFixed(2))

      setAttr(dotsRef.current, 'opacity', current.dots.toFixed(2))
      if (dotsRef.current && current.dots > 0) {
        Array.from(dotsRef.current.children).forEach((dot, index) => {
          const pulse = (Math.sin(time * 5 - index * 0.9) + 1) / 2
          setAttr(dot, 'opacity', (0.35 + pulse * 0.65).toFixed(2))
          setAttr(dot, 'transform', `translate(0 ${(-pulse * 2).toFixed(2)})`)
        })
      }

      setAttr(blushRef.current, 'opacity', thanks.toFixed(2))
      if (heartsRef.current) {
        Array.from(heartsRef.current.children).forEach((heart, index) => {
          const progress = clamp01((since('thanks') - index * 0.25) / 1.6)
          const visibleHeart = since('thanks') >= 0 && since('thanks') < 2.6 ? envelope(progress, 1) : 0
          const x = 38 + index * 12 + Math.sin(progress * 6 + index) * 3
          const y = 30 - progress * 24
          setAttr(heart, 'opacity', visibleHeart.toFixed(2))
          setAttr(heart, 'transform', `translate(${x.toFixed(2)} ${y.toFixed(2)}) scale(${(0.7 + progress * 0.5).toFixed(2)})`)
        })
      }

      const featherTime = time - featherAt
      if (featherRef.current) {
        const falling = featherTime >= 0 && featherTime < 2.4
        let featherOpacity = 0
        if (falling) featherOpacity = featherTime < 0.2 ? featherTime / 0.2 : Math.min(1, (2.4 - featherTime) / 0.5)
        setAttr(featherRef.current, 'opacity', featherOpacity.toFixed(2))
        if (falling) {
          const x = 74 + Math.sin(featherTime * 3) * 6
          const y = 62 + featherTime * 12
          setAttr(featherRef.current, 'transform', `translate(${x.toFixed(2)} ${y.toFixed(2)}) rotate(${(Math.sin(featherTime * 3) * 35).toFixed(2)})`)
        }
      }

      if (seedsRef.current) {
        const seedProgress = action?.type === 'peck' ? clamp01((actionProgress - 0.3) / 0.62) : 0
        Array.from(seedsRef.current.children).forEach((seed, index) => {
          const offset = index - 1
          const x = 50 + offset * 6 + offset * seedProgress * 9
          const y = 89 - Math.sin(seedProgress * Math.PI) * (5 + index * 2)
          setAttr(seed, 'transform', `translate(${x.toFixed(2)} ${y.toFixed(2)})`)
          setAttr(seed, 'opacity', envelope(seedProgress, 1).toFixed(2))
        })
      }

      if (bubbleRef.current) {
        setAttr(bubbleRef.current, 'opacity', bubble.toFixed(2))
        setAttr(bubbleRef.current, 'transform', `translate(77 12) scale(${(0.6 + bubble * 0.4).toFixed(2)}) translate(-77 -12)`)
      }

      setAttr(zzzRef.current, 'opacity', weights.sleep.toFixed(2))
      if (zzzRef.current && weights.sleep > 0) {
        Array.from(zzzRef.current.children).forEach((letter, index) => {
          const cycle = (time * 0.5 + index / 3) % 1
          setAttr(letter, 'opacity', envelope(cycle, 1).toFixed(2))
          setAttr(letter, 'transform', `translate(${(cycle * 6).toFixed(2)} ${(-cycle * 14).toFixed(2)})`)
        })
      }
      const reacting = time - Math.max(...REACTIONS.map((type) => reactions[type])) < 2.6 || time - jumpAt < 0.6 || time - syllableAt < 0.4
      const busy = props.state !== 'idle' || props.waving || reacting || weights.wave > 0.01 || weights.happy > 0.01 || weights.worried > 0.01
      if (weights.sleep > 0.99) frameInterval = 1 / 8
      else frameInterval = busy ? 1 / 60 : 1 / 30
    }

    const loop = () => {
      const now = clock()
      if (now - lastDraw >= frameInterval - 0.004) {
        draw(now)
        lastDraw = now
      }
      frame = visible && !document.hidden ? requestAnimationFrame(loop) : 0
    }
    const resume = () => {
      if (!frame && visible && !document.hidden && !reduceMotion) {
        lastTime = clock()
        frame = requestAnimationFrame(loop)
      }
    }

    if (reduceMotion) {
      draw(0)
      return
    }

    const markActivity = () => {
      lastActivity = clock()
    }
    const trackPointer = (event: PointerEvent) => {
      const rect = svg.getBoundingClientRect()
      pointer.x = event.clientX - (rect.left + rect.width / 2)
      pointer.y = event.clientY - (rect.top + rect.height / 2)
      pointer.active = true
      markActivity()
    }
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting
      resume()
    })
    observer.observe(svg)
    window.addEventListener('pointermove', trackPointer, { passive: true })
    window.addEventListener('keydown', markActivity)
    window.addEventListener('scroll', markActivity, { passive: true })
    document.addEventListener('visibilitychange', resume)
    frame = requestAnimationFrame(loop)

    return () => {
      cancelAnimationFrame(frame)
      observer.disconnect()
      window.removeEventListener('pointermove', trackPointer)
      window.removeEventListener('keydown', markActivity)
      window.removeEventListener('scroll', markActivity)
      document.removeEventListener('visibilitychange', resume)
    }
  }, [stopAnimations])

  return (
    <svg
      ref={svgRef}
      viewBox="0 0 100 100"
      width={size}
      height={size}
      className={`overflow-visible ${className}`}
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      <ellipse ref={shadowRef} cx="50" cy="91" rx="20" ry="3" fill="rgb(0 0 0 / 0.08)" />
      <g ref={airRef}>
        <g fill="none" stroke="var(--orange-500)" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
          <path ref={leftFootRef} d="M42,83 L42,89 M38.5,91.5 L42,89 L45.5,91.5" />
          <path ref={rightFootRef} d="M58,83 L58,89 M54.5,91.5 L58,89 L61.5,91.5" />
        </g>
        <g ref={groupRef}>
          <path ref={leftWingRef} d="M27,50 C17,42 9,45 10,50 C11,57 18,62 27,61 Z" fill="#f9dc2b" stroke="#5a3a17" strokeWidth="2.1" strokeLinejoin="round" />
          <path ref={rightWingRef} d="M73,50 C83,42 91,45 90,50 C89,57 82,62 73,61 Z" fill="#f9dc2b" stroke="#5a3a17" strokeWidth="2.1" strokeLinejoin="round" />
          <path ref={bodyRef} d={blobPath(0, 0)} fill="#fbe032" stroke="#5a3a17" strokeWidth="2.4" strokeLinejoin="round" />
          <g ref={blushRef} fill="var(--pink-300)" opacity="0">
            <ellipse cx="34" cy="58" rx="4.5" ry="2.6" />
            <ellipse cx="66" cy="58" rx="4.5" ry="2.6" />
          </g>
          <path ref={browsRef} d="M34,45 L43,42 M57,42 L66,45" fill="none" stroke="#2b1a0c" strokeWidth="2" strokeLinecap="round" opacity="0" />
          <g ref={lookRef}>
            <g ref={eyesRef} fill="#2b1a0c">
              <ellipse cx="39" cy={EYE_Y} rx="3.1" ry="3.4" />
              <ellipse cx="61" cy={EYE_Y} rx="3.1" ry="3.4" />
            </g>
          </g>
          <path ref={happyEyesRef} d="M35,53 Q39,47 43,53 M57,53 Q61,47 65,53" fill="none" stroke="#2b1a0c" strokeWidth="2.4" strokeLinecap="round" opacity="0" />
          <path ref={sleepEyesRef} d="M35,51 Q39,54.5 43,51 M57,51 Q61,54.5 65,51" fill="none" stroke="#2b1a0c" strokeWidth="2.2" strokeLinecap="round" opacity="0" />
          <path ref={mouthRef} d="M45.3,57.2 L50,61.6 L54.7,57.2 L50,59 Z" fill="#5a2416" opacity="0" />
          <ellipse ref={tongueRef} cx="50" cy="57.5" rx="2.3" ry="1.2" fill="#ff8f9a" opacity="0" />
          <path ref={lowerBeakRef} d="M45.6,57.4 L50,58.6 L54.4,57.4 L50,62.4 Z" fill="#e2761a" strokeLinejoin="round" />
          <path ref={upperBeakRef} d="M45,57 Q50,55.6 55,57 L50,61.6 Z" fill="#f28a24" strokeLinejoin="round" />
        </g>
      </g>
      <g ref={seedsRef} fill="#a8742c">
        <ellipse rx="1.3" ry="0.9" opacity="0" />
        <ellipse rx="1.3" ry="0.9" opacity="0" />
        <ellipse rx="1.3" ry="0.9" opacity="0" />
      </g>
      <g ref={featherRef} opacity="0">
        <path d="M0,-5 C3,-3 3,3 0,5 C-3,3 -3,-3 0,-5 Z" fill="#fbe032" stroke="#5a3a17" strokeWidth="0.8" />
        <path d="M0,-4 L0,6" stroke="#5a3a17" strokeWidth="0.6" strokeLinecap="round" />
      </g>
      <g ref={heartsRef} fill="#e63946">
        <path d={HEART_PATH} opacity="0" />
        <path d={HEART_PATH} opacity="0" />
        <path d={HEART_PATH} opacity="0" />
      </g>
      <g ref={bubbleRef} opacity="0">
        <rect x="61" y="3" width="32" height="15" rx="7.5" fill="#fff" stroke="#5a3a17" strokeWidth="1.2" />
        <path d="M66,17.4 L63,22 L70,17.6" fill="#fff" stroke="#5a3a17" strokeWidth="1.2" strokeLinejoin="round" />
        <text x="77" y="13.6" textAnchor="middle" fontSize="8.5" fontWeight="700" fill="#5a3a17" fontFamily="var(--font-heading, sans-serif)">
          ¡Pío!
        </text>
      </g>
      <g ref={dotsRef} opacity="0" fill="var(--green-500)">
        <circle cx="70" cy="22" r="2.6" />
        <circle cx="78" cy="16" r="3.2" />
        <circle cx="87" cy="9" r="3.8" />
      </g>
      <g ref={zzzRef} opacity="0" fill="var(--green-600)" fontFamily="var(--font-heading, sans-serif)" fontWeight="700">
        <text x="66" y="34" fontSize="9">
          z
        </text>
        <text x="66" y="34" fontSize="11">
          z
        </text>
        <text x="66" y="34" fontSize="13">
          z
        </text>
      </g>
    </svg>
  )
}

export default ChickAvatar
