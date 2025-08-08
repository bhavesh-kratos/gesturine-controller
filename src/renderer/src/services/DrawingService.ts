import { Landmark } from '@mediapipe/tasks-vision'
import { drawConnectors, drawLandmarks } from '@mediapipe/drawing_utils'
import { HAND_CONNECTIONS } from '@mediapipe/hands'

export class DrawingService {
  private ctx: CanvasRenderingContext2D | null = null
  private isDevelopment: boolean = import.meta.env.DEV

  initialize(canvas: HTMLCanvasElement): void {
    // Make sure canvas dimensions match the display size
    const displayWidth = canvas.clientWidth
    const displayHeight = canvas.clientHeight
    canvas.width = displayWidth
    canvas.height = displayHeight

    this.ctx = canvas.getContext('2d')
    if (!this.ctx) {
      console.error('Failed to get 2D context')
      return
    }

    // Set up initial canvas state
    this.ctx.strokeStyle = '#00ff00'
    this.ctx.lineWidth = 2
    console.log('✅ Drawing service initialized successfully')
  }

  clearCanvas(): void {
    if (!this.ctx || !this.isDevelopment) return
    const canvas = this.ctx.canvas
    this.ctx.clearRect(0, 0, canvas.width, canvas.height)
  }

  drawHandLandmarks(landmarks: Landmark[], isLeftHand: boolean): void {
    if (!this.ctx || !this.isDevelopment) return

    // Set different colors for left and right hands
    const color = isLeftHand ? '#00ff00' : '#ff0000'

    // Mirror the landmarks to match the mirrored video display
    const mirroredLandmarks = landmarks.map((landmark) => ({
      ...landmark,
      x: 1 - landmark.x // Mirror the x coordinate
    }))

    // Draw connections between landmarks using MediaPipe's utility
    drawConnectors(this.ctx, mirroredLandmarks, HAND_CONNECTIONS, {
      color,
      lineWidth: 2
    })

    // Draw landmark points using MediaPipe's utility
    drawLandmarks(this.ctx, mirroredLandmarks, {
      color,
      lineWidth: 1,
      radius: 3
    })
  }
}

export const drawingService = new DrawingService()
