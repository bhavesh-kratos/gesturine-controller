import { FilesetResolver, HandLandmarker } from '@mediapipe/tasks-vision'

interface Landmark {
  x: number
  y: number
  z: number
}

interface HandLandmarkResult {
  landmarks: Landmark[][]
  worldLandmarks: Landmark[][]
  handednesses: Array<Array<{ categoryName: string }>>
}

interface GestureResult {
  type: string
  confidence: number
  handedness?: string
  hand?: 'left' | 'right' | 'any'
  landmarks?: Landmark[]
  timestamp?: number
}

interface FingerState {
  name: string
  extended: boolean
}

interface GestureCheck {
  type: string
  check: () => { detected: boolean; confidence: number }
}

class GestureDetector {
  private handLandmarker: HandLandmarker | null
  private isInitialized: boolean
  private isProcessing: boolean
  private gestureCallbacks: Map<string, ((data: GestureResult) => void)[]>
  private lastGesture: string | null
  private gestureConfidence: number
  private gestureHistory: GestureResult[]
  private gestureThreshold: number

  constructor() {
    this.handLandmarker = null
    this.isInitialized = false
    this.isProcessing = false
    this.gestureCallbacks = new Map()
    this.lastGesture = null
    this.gestureConfidence = 0
    this.gestureHistory = []
    this.gestureThreshold = 0.8 // Minimum confidence for gesture detection
  }

  // Initialize MediaPipe Hand Landmarker
  async initialize(): Promise<void> {
    try {
      // Load the MediaPipe model files
      const vision = await FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm'
      )

      // Create Hand Landmarker instance
      this.handLandmarker = await HandLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath:
            'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task',
          delegate: 'GPU' // Use GPU if available for better performance
        },
        runningMode: 'VIDEO', // For real-time video processing
        numHands: 2, // Track up to 2 hands
        minHandDetectionConfidence: 0.5,
        minHandPresenceConfidence: 0.8,
        minTrackingConfidence: 0.5
      })

      this.isInitialized = true
      console.log('✅ MediaPipe Hand Landmarker initialized successfully')
    } catch (error) {
      console.error('❌ Failed to initialize MediaPipe:', error)
      throw error
    }
  }

  // Process video frame and detect gestures
  async processFrame(
    videoElement: HTMLVideoElement,
    timestamp: number
  ): Promise<GestureResult[] | null> {
    if (!this.isInitialized || this.isProcessing || !this.handLandmarker) {
      console.warn('GestureDetector is not initialized or already processing')
      return null
    }

    this.isProcessing = true

    try {
      // Detect hand landmarks
      const results = this.handLandmarker.detectForVideo(
        videoElement,
        timestamp
      ) as HandLandmarkResult

      // Process results if hands are detected
      if (results.landmarks && results.landmarks.length > 0) {
        const gestures = this.processHandLandmarks(results)
        this.updateGestureHistory(gestures)
        return gestures
      }

      return null
    } catch (error) {
      console.error('Error processing frame:', error)
      return null
    } finally {
      this.isProcessing = false
    }
  }

  // Process hand landmarks to detect gestures
  private processHandLandmarks(results: HandLandmarkResult): GestureResult[] {
    const detectedGestures: GestureResult[] = []
    // console.log('Processing hand landmarks:', results)

    for (let i = 0; i < results.landmarks.length; i++) {
      const landmarks = results.landmarks[i]
      const handedness = results.worldLandmarks[i]
      const hand = results.handednesses[i][0]

      // Detect various gestures
      const gesture = this.detectGesture(landmarks, hand.categoryName)

      if (gesture) {
        detectedGestures.push({
          type: gesture.type,
          confidence: gesture.confidence,
          hand: hand.categoryName, // "Left" or "Right"
          landmarks: landmarks,
          timestamp: Date.now()
        })
      }
    }

    return detectedGestures
  }

  // Main gesture detection logic
  private detectGesture(landmarks: Landmark[], handedness: string): GestureResult | null {
    // Get key landmark points
    const thumb = landmarks[4]
    const indexFinger = landmarks[8]
    const middleFinger = landmarks[12]
    const ringFinger = landmarks[16]
    const pinky = landmarks[20]
    const wrist = landmarks[0]

    // Calculate finger extensions
    const fingers = this.getFingerStates(landmarks)
    const extendedFingers = fingers.filter((f) => f.extended).length

    // Detect specific gestures
    const gestureChecks: GestureCheck[] = [
      { type: 'fist', check: () => this.detectFist(fingers) },
      { type: 'open_palm', check: () => this.detectOpenPalm(fingers) },
      { type: 'pointing', check: () => this.detectPointing(fingers) },
      { type: 'peace_sign', check: () => this.detectPeaceSign(fingers) },
      { type: 'thumbs_up', check: () => this.detectThumbsUp(fingers, landmarks) },
      { type: 'thumbs_down', check: () => this.detectThumbsDown(fingers, landmarks) },
      { type: 'ok_sign', check: () => this.detectOkSign(fingers, landmarks) },
      { type: 'rock_on', check: () => this.detectRockOn(fingers) }
    ]

    // console.log({ fingers })
    // Check each gesture
    for (const gesture of gestureChecks) {
      const result = gesture.check()
      if (result.detected && result.confidence > this.gestureThreshold) {
        return {
          type: gesture.type,
          confidence: result.confidence,
          handedness: handedness
        }
      }
    }

    return null
  }

  // Get finger extension states
  private getFingerStates(landmarks: Landmark[]): FingerState[] {
    const fingers: FingerState[] = [
      { name: 'thumb', extended: this.isThumbExtended(landmarks) },
      { name: 'index', extended: this.isFingerExtended(landmarks, 8, 6) },
      { name: 'middle', extended: this.isFingerExtended(landmarks, 12, 10) },
      { name: 'ring', extended: this.isFingerExtended(landmarks, 16, 14) },
      { name: 'pinky', extended: this.isFingerExtended(landmarks, 20, 18) }
    ]
    return fingers
  }

  // Check if finger is extended
  private isFingerExtended(landmarks: Landmark[], tipIndex: number, pipIndex: number): boolean {
    const tip = landmarks[tipIndex]
    const pip = landmarks[pipIndex]
    return tip.y < pip.y // Tip is above PIP joint
  }

  // Check if thumb is extended
  private isThumbExtended(landmarks: Landmark[]): boolean {
    const thumbTip = landmarks[4]
    const thumbMcp = landmarks[2]
    return thumbTip.x > thumbMcp.x // Thumb tip is to the right of MCP
  }

  // Gesture Detection Methods
  private detectFist(fingers: FingerState[]): { detected: boolean; confidence: number } {
    const extendedCount = fingers.filter((f) => f.extended).length
    return {
      detected: extendedCount === 0,
      confidence: extendedCount === 0 ? 0.95 : 0.2
    }
  }

  private detectOpenPalm(fingers: FingerState[]): { detected: boolean; confidence: number } {
    const extendedCount = fingers.filter((f) => f.extended).length
    return {
      detected: extendedCount === 5,
      confidence: extendedCount === 5 ? 0.95 : 0.2
    }
  }

  private detectPointing(fingers: FingerState[]): { detected: boolean; confidence: number } {
    const isIndexExtended = fingers[1].extended
    const otherFingersExtended = fingers.filter((f, i) => i !== 1 && f.extended).length

    return {
      detected: isIndexExtended && otherFingersExtended === 0,
      confidence: isIndexExtended && otherFingersExtended === 0 ? 0.9 : 0.3
    }
  }

  private detectPeaceSign(fingers: FingerState[]): { detected: boolean; confidence: number } {
    const indexExtended = fingers[1].extended
    const middleExtended = fingers[2].extended
    const otherFingersExtended = fingers.filter((f, i) => i !== 1 && i !== 2 && f.extended).length

    return {
      detected: indexExtended && middleExtended && otherFingersExtended === 0,
      confidence: indexExtended && middleExtended && otherFingersExtended === 0 ? 0.9 : 0.3
    }
  }

  private detectThumbsUp(
    fingers: FingerState[],
    landmarks: Landmark[]
  ): { detected: boolean; confidence: number } {
    const thumbExtended = fingers[0].extended
    const otherFingersExtended = fingers.filter((f, i) => i !== 0 && f.extended).length

    // Check if thumb is pointing up
    const thumbTip = landmarks[4]
    const wrist = landmarks[0]
    const thumbPointingUp = thumbTip.y < wrist.y

    return {
      detected: thumbExtended && otherFingersExtended === 0 && thumbPointingUp,
      confidence: thumbExtended && otherFingersExtended === 0 && thumbPointingUp ? 0.9 : 0.3
    }
  }

  private detectThumbsDown(
    fingers: FingerState[],
    landmarks: Landmark[]
  ): { detected: boolean; confidence: number } {
    const thumbExtended = fingers[0].extended
    const otherFingersExtended = fingers.filter((f, i) => i !== 0 && f.extended).length

    // Check if thumb is pointing down
    const thumbTip = landmarks[4]
    const wrist = landmarks[0]
    const thumbPointingDown = thumbTip.y > wrist.y

    return {
      detected: thumbExtended && otherFingersExtended === 0 && thumbPointingDown,
      confidence: thumbExtended && otherFingersExtended === 0 && thumbPointingDown ? 0.9 : 0.3
    }
  }

  private detectOkSign(
    fingers: FingerState[],
    landmarks: Landmark[]
  ): { detected: boolean; confidence: number } {
    const thumbTip = landmarks[4]
    const indexTip = landmarks[8]

    // Calculate distance between thumb and index finger tips
    const distance = Math.sqrt(
      Math.pow(thumbTip.x - indexTip.x, 2) + Math.pow(thumbTip.y - indexTip.y, 2)
    )

    const isCircle = distance < 0.05 // Threshold for "touching"
    const otherFingersExtended = fingers.filter((f, i) => i !== 0 && i !== 1 && f.extended).length

    return {
      detected: isCircle && otherFingersExtended === 3,
      confidence: isCircle && otherFingersExtended === 3 ? 0.85 : 0.3
    }
  }

  private detectRockOn(fingers: FingerState[]): { detected: boolean; confidence: number } {
    const indexExtended = fingers[1].extended
    const pinkyExtended = fingers[4].extended
    const thumbExtended = fingers[0].extended
    const middleExtended = fingers[2].extended
    const ringExtended = fingers[3].extended

    return {
      detected: indexExtended && pinkyExtended && thumbExtended && !middleExtended && !ringExtended,
      confidence:
        indexExtended && pinkyExtended && thumbExtended && !middleExtended && !ringExtended
          ? 0.85
          : 0.3
    }
  }

  // Update gesture history for smoothing
  private updateGestureHistory(gestures: GestureResult[] | null): void {
    const maxHistory = 5

    if (gestures && gestures.length > 0) {
      this.gestureHistory.push(gestures[0])

      if (this.gestureHistory.length > maxHistory) {
        this.gestureHistory.shift()
      }

      // Smooth gesture detection
      this.smoothGestureDetection()
    }
  }

  // Smooth gesture detection to reduce false positives
  private smoothGestureDetection(): void {
    if (this.gestureHistory.length < 3) return

    const recentGestures = this.gestureHistory.slice(-3)
    const gestureTypes = recentGestures.map((g) => g.type)

    // Check if we have consistent gesture detection
    const consistentGesture = gestureTypes.every((type) => type === gestureTypes[0])

    if (consistentGesture && gestureTypes[0] !== this.lastGesture) {
      this.lastGesture = gestureTypes[0]
      this.triggerGestureCallback(gestureTypes[0], recentGestures[0])
    }
  }

  // Register gesture callback
  onGesture(gestureType: string, callback: (data: GestureResult) => void): void {
    if (!this.gestureCallbacks.has(gestureType)) {
      this.gestureCallbacks.set(gestureType, [])
    }
    const callbacks = this.gestureCallbacks.get(gestureType)
    if (callbacks) {
      callbacks.push(callback)
    }
  }

  // Trigger gesture callback
  private triggerGestureCallback(gestureType: string, gestureData: GestureResult): void {
    const callbacks = this.gestureCallbacks.get(gestureType)
    if (callbacks) {
      callbacks.forEach((callback) => callback(gestureData))
    }
  }

  // Cleanup
  dispose(): void {
    if (this.handLandmarker) {
      this.handLandmarker.close()
    }
    this.gestureCallbacks.clear()
    this.gestureHistory = []
  }
}

export default GestureDetector
