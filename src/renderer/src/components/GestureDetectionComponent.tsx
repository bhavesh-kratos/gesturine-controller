import React, { useEffect, useRef, useState } from 'react'
import GestureDetector from '../services/GestureDetector'
import { is } from '@electron-toolkit/utils'

interface Props {
  // Add any props here if needed
}

const GestureDetectionComponent: React.FC<Props> = () => {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const gestureDetectorRef = useRef<GestureDetector | null>(null)
  const [isActive, setIsActive] = useState<boolean>(false)
  const [detectedGesture, setDetectedGesture] = useState<string | null>(null)
  const [fps, setFps] = useState<number>(0)

  useEffect(() => {
    initializeGestureDetection()

    return () => {
      if (gestureDetectorRef.current) {
        gestureDetectorRef.current.dispose()
      }
    }
  }, [])

  const initializeGestureDetection = async (): Promise<void> => {
    try {
      // Initialize gesture detector
      gestureDetectorRef.current = new GestureDetector()
      await gestureDetectorRef.current.initialize()

      // Set up gesture callbacks
      gestureDetectorRef.current.onGesture('fist', (data) => {
        console.log('Fist detected!', data)
        setDetectedGesture('fist')
        // Trigger key binding here
      })

      gestureDetectorRef.current.onGesture('open_palm', (data) => {
        console.log('Open palm detected!', data)
        setDetectedGesture('open_palm')
        // Trigger key binding here
      })

      gestureDetectorRef.current.onGesture('pointing', (data) => {
        console.log('Pointing detected!', data)
        setDetectedGesture('pointing')
        // Trigger key binding here
      })

      // Start camera
      await startCamera()
    } catch (error) {
      console.error('Failed to initialize gesture detection:', error)
    }
  }

  const startCamera = async (): Promise<void> => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: 640,
          height: 480,
          frameRate: 30
        }
      })

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.onloadedmetadata = () => {
          if (videoRef.current) {
            videoRef.current.play()
            setIsActive(true)
            startGestureDetection()
          }
        }
      }
    } catch (error) {
      console.error('Error accessing camera:', error)
    }
  }

  const startGestureDetection = (): void => {
    let lastTime = 0
    let frameCount = 0
    let fpsTime = Date.now()

    const detectGestures = async (timestamp: number): Promise<void> => {
      if (!gestureDetectorRef.current || !videoRef.current) {
        console.warn('Gesture detection is inactive or not initialized')
        console.log({ videoRef, gestureDetectorRef, isActive })
        return
      }

      // console.log('Processing frame...')

      // Process frame
      await gestureDetectorRef.current.processFrame(videoRef.current, timestamp)

      // Update FPS
      frameCount++
      const currentTime = Date.now()
      if (currentTime - fpsTime >= 1000) {
        setFps(frameCount)
        frameCount = 0
        fpsTime = currentTime
      }

      // Clear gesture after 2 seconds
      if (detectedGesture && currentTime - lastTime > 2000) {
        setDetectedGesture(null)
        lastTime = currentTime
      }

      // Continue processing
      requestAnimationFrame(detectGestures)
    }

    requestAnimationFrame(detectGestures)
  }

  return (
    <div className="gesture-detection-container">
      <div className="video-container">
        <video
          ref={videoRef}
          width={640}
          height={480}
          style={{ transform: 'scaleX(-1)' }} // Mirror video
        />
        <canvas
          ref={canvasRef}
          width={640}
          height={480}
          style={{ position: 'absolute', top: 0, left: 0 }}
        />
      </div>

      <div className="status-panel">
        <div>Status: {isActive ? 'Active' : 'Inactive'}</div>
        <div>FPS: {fps}</div>
        <div>Detected Gesture: {detectedGesture || 'None'}</div>
      </div>
    </div>
  )
}

export default GestureDetectionComponent
