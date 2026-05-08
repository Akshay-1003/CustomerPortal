import { useEffect, useState } from "react"
import { animate, useMotionValue, useMotionValueEvent, useSpring } from "framer-motion"

interface AnimatedMetricProps {
  value: number
  formatter?: (value: number) => string
  className?: string
}

export function AnimatedMetric({
  value,
  formatter = (current) => current.toFixed(0),
  className,
}: AnimatedMetricProps) {
  const motionValue = useMotionValue(value)
  const springValue = useSpring(motionValue, { stiffness: 120, damping: 20 })
  const [displayValue, setDisplayValue] = useState(value)

  useEffect(() => {
    const controls = animate(motionValue, value, { duration: 0.9, ease: "easeOut" })
    return () => controls.stop()
  }, [motionValue, value])

  useMotionValueEvent(springValue, "change", (latest) => {
    setDisplayValue(latest)
  })

  return <span className={className}>{formatter(displayValue)}</span>
}
