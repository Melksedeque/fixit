"use client"

import { useEffect, useRef, useState } from "react"
import { cn } from "@/lib/utils"

export type JCState = "idle" | "following" | "pointing" | "happy" | "facepalm" | "hiding"

interface JCCharacterProps {
  state: JCState
  className?: string
}

export function JCCharacter({ state, className }: JCCharacterProps) {
  const [eyePosition, setEyePosition] = useState({ x: 0, y: 0 })
  const svgRef = useRef<SVGSVGElement>(null)

  useEffect(() => {
    if (state !== "following" && state !== "hiding") {
        setEyePosition({ x: 0, y: 0 })
        return
    }

    const handleMouseMove = (e: MouseEvent) => {
      if (!svgRef.current) return

      const rect = svgRef.current.getBoundingClientRect()
      const centerX = rect.left + rect.width / 2
      const centerY = rect.top + rect.height / 2

      // Calculate distance from center
      const deltaX = e.clientX - centerX
      const deltaY = e.clientY - centerY

      // Limit movement radius
      const maxRadius = 10
      const angle = Math.atan2(deltaY, deltaX)
      const distance = Math.min(Math.sqrt(deltaX * deltaX + deltaY * deltaY) / 10, maxRadius)

      setEyePosition({
        x: Math.cos(angle) * distance,
        y: Math.sin(angle) * distance,
      })
    }

    if (state === "following") {
        window.addEventListener("mousemove", handleMouseMove)
    }

    return () => {
      window.removeEventListener("mousemove", handleMouseMove)
    }
  }, [state])

  // Componentes SVG internos
  const Head = () => (
    <g id="head">
      {/* Neck */}
      <path d="M85 140 L85 180 L115 180 L115 140" fill="#fca" />
      
      {/* Face Base */}
      <path d="M50 60 C50 10 150 10 150 60 L150 110 C150 150 50 150 50 110 Z" fill="#fca" />
      
      {/* Hair */}
      <path d="M45 60 C40 20 60 -10 100 0 C140 -10 160 20 155 60 C160 30 140 10 100 15 C60 10 40 30 45 60" fill="#422" />
      <path d="M100 15 C110 5 130 5 120 20" fill="#422" />

      {/* Ears */}
      <circle cx="45" cy="90" r="10" fill="#fca" />
      <circle cx="155" cy="90" r="10" fill="#fca" />
    </g>
  )

  const Eyes = () => {
    if (state === "hiding") return null
    if (state === "happy") return (
        <g>
            <path d="M65 85 Q75 75 85 85" stroke="#333" strokeWidth="3" fill="none" />
            <path d="M115 85 Q125 75 135 85" stroke="#333" strokeWidth="3" fill="none" />
        </g>
    )

    return (
      <g id="eyes">
        {/* White */}
        <ellipse cx="75" cy="85" rx="12" ry="15" fill="white" stroke="#ddd" strokeWidth="1" />
        <ellipse cx="125" cy="85" rx="12" ry="15" fill="white" stroke="#ddd" strokeWidth="1" />
        
        {/* Pupils */}
        <g style={{ transform: `translate(${eyePosition.x}px, ${eyePosition.y}px)` }}>
          <circle cx="75" cy="85" r="5" fill="#333" />
          <circle cx="125" cy="85" r="5" fill="#333" />
        </g>

        {/* Eyebrows */}
        <path d="M65 70 Q75 65 85 70" stroke="#422" strokeWidth="3" fill="none" />
        <path d="M115 70 Q125 65 135 70" stroke="#422" strokeWidth="3" fill="none" />
      </g>
    )
  }

  const Mouth = () => {
    if (state === "happy") {
      return <path d="M80 120 Q100 140 120 120" stroke="#333" strokeWidth="3" fill="none" />
    }
    if (state === "facepalm") {
        return <path d="M90 130 Q100 125 110 130" stroke="#333" strokeWidth="3" fill="none" />
    }
    return <path d="M85 130 Q100 135 115 130" stroke="#333" strokeWidth="3" fill="none" />
  }

  const Body = () => (
    <g id="body">
      {/* Shirt */}
      <path d="M30 180 C30 160 170 160 170 180 L170 200 L30 200 Z" fill="#2563eb" />
      {/* Collar */}
      <path d="M85 180 L100 200 L115 180" fill="none" stroke="#1e40af" strokeWidth="2" />
    </g>
  )

  const Hands = () => {
    if (state === "hiding") {
        return (
            <g>
                 {/* Hands covering eyes */}
                <path d="M60 140 C50 100 60 70 90 70 C100 70 110 80 100 100" fill="#fca" stroke="#eeb" strokeWidth="1"/>
                <path d="M140 140 C150 100 140 70 110 70 C100 70 90 80 100 100" fill="#fca" stroke="#eeb" strokeWidth="1"/>
            </g>
        )
    }
    if (state === "facepalm") {
        return (
            <g>
                {/* Hand on forehead */}
                <path d="M140 140 C160 100 120 50 90 60 C80 65 80 80 100 90" fill="#fca" stroke="#eeb" strokeWidth="1"/>
            </g>
        )
    }
    if (state === "pointing") {
        return (
            <g>
                {/* Hand pointing down */}
                <path d="M160 160 C180 150 190 140 180 130 C170 120 160 130 150 150 L140 180" fill="#fca" stroke="#eeb" strokeWidth="1"/>
                <path d="M140 180 L140 220" stroke="#fca" strokeWidth="12" strokeLinecap="round" />
            </g>
        )
    }
    if (state === "happy") {
         return (
            <g>
                {/* Thumbs up */}
                <path d="M160 160 C170 150 180 150 180 140 C180 130 170 120 160 130 L160 110" fill="#fca" stroke="#eeb" strokeWidth="1"/>
                <circle cx="160" cy="110" r="8" fill="#fca" />
            </g>
        )
    }
    return null
  }

  return (
    <div className={cn("relative w-48 h-48 mx-auto transition-all duration-300", className)}>
      <svg
        ref={svgRef}
        viewBox="0 0 200 200"
        className="w-full h-full drop-shadow-lg"
        xmlns="http://www.w3.org/2000/svg"
      >
        <Body />
        <Head />
        <Eyes />
        <Mouth />
        <Hands />
      </svg>
    </div>
  )
}
