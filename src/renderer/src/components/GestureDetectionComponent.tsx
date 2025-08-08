import React, { useCallback, useEffect, useRef, useState } from 'react'
import GestureDetector from '../services/GestureDetector'
import { gestureDetectionService } from '../services/GestureDetectionService'
import { drawingService } from '../services/DrawingService'
import { Landmark } from '@mediapipe/tasks-vision'

interface Props {
  // Add any props here if needed
}

const GestureDetectionComponent: React.FC<Props> = () => {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const gestureDetectorRef = useRef<GestureDetector | null>(null)
  const animationFrameRef = useRef<number>(null)
  const [isActive, setIsActive] = useState<boolean>(false)
  const [detectedGesture, setDetectedGesture] = useState<string | null>(null)
  const [fps, setFps] = useState<number>(0)
  const lastTimeRef = useRef<number>(0)
  const frameCountRef = useRef<number>(0)
  const fpsTimeRef = useRef<number>(Date.now())

  const processFrame = useCallback(async (timestamp: number): Promise<void> => {
    if (!gestureDetectorRef.current || !videoRef.current) {
      console.warn('Gesture detection is inactive or not initialized')
      return
    }

    try {
      drawingService.clearCanvas()

      const results = await gestureDetectorRef.current.processFrame(videoRef.current, timestamp)

      // Draw hand landmarks if hands are detected
      if (results && results.length > 0) {
        results.forEach((result) => {
          if (result.landmarks) {
            const isLeftHand = result.handedness?.toLowerCase() === 'left'
            const landmarksWithVisibility = result.landmarks.map((landmark) => ({
              ...landmark,
              visibility: 1.0
            })) as Landmark[]
            drawingService.drawHandLandmarks(landmarksWithVisibility, isLeftHand)
          }
        })

        // Handle detected gestures
        results.forEach((gesture) => {
          setDetectedGesture(gesture.type)
          const hand = gesture.handedness?.toLowerCase() as 'left' | 'right' | 'any'
          gestureDetectionService.handleGestureDetected(gesture.type, hand || 'any')
        })
      }

      // Update FPS
      frameCountRef.current++
      const currentTime = Date.now()
      if (currentTime - fpsTimeRef.current >= 1000) {
        setFps(frameCountRef.current)
        frameCountRef.current = 0
        fpsTimeRef.current = currentTime
      }

      // Clear gesture after 2 seconds
      if (detectedGesture && currentTime - lastTimeRef.current > 2000) {
        setDetectedGesture(null)
        lastTimeRef.current = currentTime
      }
    } catch (err) {
      console.error('Error processing frame:', err)
    }

    // Continue the animation loop
    animationFrameRef.current = requestAnimationFrame(processFrame)
  }, [])

  const startCamera = useCallback(async (): Promise<void> => {
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
            // Start the animation loop
            animationFrameRef.current = requestAnimationFrame(processFrame)
          }
        }
      }
    } catch (error) {
      console.error('Error accessing camera:', error)
    }
  }, [processFrame])

  const initializeGestureDetection = useCallback(async (): Promise<void> => {
    if (gestureDetectorRef.current) {
      return // Already initialized
    }

    try {
      // Initialize gesture detector
      gestureDetectorRef.current = new GestureDetector()
      await gestureDetectorRef.current.initialize()

      // Initialize drawing service
      if (canvasRef.current) {
        drawingService.initialize(canvasRef.current)
      }

      // Set up gesture callbacks
      const setupGestureCallback = (gesture: string): void => {
        gestureDetectorRef.current?.onGesture(gesture, (data) => {
          console.log(`Gesture detected: ${gesture}`)
          setDetectedGesture(gesture)
          const hand = data.handedness?.toLowerCase() as 'left' | 'right' | 'any'
          gestureDetectionService.handleGestureDetected(gesture, hand || 'any')
        })
      }

      // Set up all gesture callbacks
      setupGestureCallback('fist')
      setupGestureCallback('open_palm')
      setupGestureCallback('pointing')
      setupGestureCallback('thumbs_up')
      setupGestureCallback('thumbs_down')
      setupGestureCallback('peace_sign')
      setupGestureCallback('ok_sign')
      setupGestureCallback('rock_on')

      gestureDetectorRef.current?.onGesture('no_gesture', () => {
        setDetectedGesture(null)
        gestureDetectionService.handleGestureDetected(null)
      })

      // Start camera
      await startCamera()
    } catch (error) {
      console.error('Failed to initialize gesture detection:', error)
    }
  }, [startCamera])

  useEffect(() => {
    initializeGestureDetection()

    return () => {
      // Cleanup function
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
      if (gestureDetectorRef.current) {
        gestureDetectorRef.current.dispose()
        gestureDetectorRef.current = null
      }
      if (videoRef.current?.srcObject instanceof MediaStream) {
        videoRef.current.srcObject.getTracks().forEach((track) => track.stop())
      }
    }
  }, [initializeGestureDetection])

  return (
    <div className="gesture-detection-container">
      <div className="video-container">
        <video ref={videoRef} width={640} height={480} style={{ transform: 'scaleX(-1)' }} />
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
