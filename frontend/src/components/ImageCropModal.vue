<template>
  <div v-if="show" class="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
    <div class="bg-[#0a1628] border border-[#ecebe8]/10 rounded-2xl p-6 max-w-2xl w-full">
      <h2 class="text-2xl text-[#ecebe8] font-bold mb-4">Recadrer l'image</h2>
      
      <!-- Canvas Container -->
      <div class="relative bg-[#071429] rounded-xl overflow-hidden mb-4" style="height: 400px;">
        <canvas
          ref="canvas"
          @mousedown="startCrop"
          @mousemove="updateCrop"
          @mouseup="endCrop"
          @touchstart="startCrop"
          @touchmove="updateCrop"
          @touchend="endCrop"
          class="cursor-crosshair max-w-full max-h-full mx-auto"
        ></canvas>
      </div>

      <!-- Instructions -->
      <p class="text-[#ecebe8]/50 text-sm mb-4 text-center">
        Cliquez et faites glisser pour sélectionner la zone à recadrer
      </p>

      <!-- Actions -->
      <div class="flex gap-3 justify-end">
        <button
          @click="cancel"
          class="px-6 py-2 bg-[#071429] text-[#ecebe8] rounded-lg hover:bg-[#071429]/80 transition-colors"
        >
          Annuler
        </button>
        <button
          @click="cropAndSave"
          class="px-6 py-2 bg-[#03b5aa] text-white rounded-lg hover:bg-[#03b5aa]/90 transition-colors"
        >
          Valider
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, nextTick } from 'vue'

const props = defineProps<{
  show: boolean
  imageFile: File | null
}>()

const emit = defineEmits<{
  close: []
  cropped: [blob: Blob]
}>()

const canvas = ref<HTMLCanvasElement | null>(null)
const ctx = ref<CanvasRenderingContext2D | null>(null)
const image = ref<HTMLImageElement | null>(null)

const cropStart = ref({ x: 0, y: 0 })
const cropEnd = ref({ x: 0, y: 0 })
const isCropping = ref(false)

// Load image when file changes
watch(() => props.imageFile, async (file) => {
  if (!file || !props.show) return
  
  await nextTick()
  
  const img = new Image()
  const reader = new FileReader()
  
  reader.onload = (e) => {
    img.src = e.target?.result as string
  }
  
  img.onload = () => {
    image.value = img
    setupCanvas()
  }
  
  reader.readAsDataURL(file)
})

const setupCanvas = () => {
  if (!canvas.value || !image.value) return
  
  const canvasEl = canvas.value
  ctx.value = canvasEl.getContext('2d')
  
  if (!ctx.value) return
  
  // Calculate canvas size to fit image while maintaining aspect ratio
  const maxWidth = 600
  const maxHeight = 400
  let width = image.value.width
  let height = image.value.height
  
  if (width > maxWidth) {
    height = (height * maxWidth) / width
    width = maxWidth
  }
  
  if (height > maxHeight) {
    width = (width * maxHeight) / height
    height = maxHeight
  }
  
  canvasEl.width = width
  canvasEl.height = height
  
  drawImage()
}

const drawImage = () => {
  if (!ctx.value || !canvas.value || !image.value) return
  
  // Clear canvas
  ctx.value.clearRect(0, 0, canvas.value.width, canvas.value.height)
  
  // Draw image
  ctx.value.drawImage(image.value, 0, 0, canvas.value.width, canvas.value.height)
  
  // Draw crop rectangle if cropping
  if (isCropping.value || (cropEnd.value.x !== 0 && cropEnd.value.y !== 0)) {
    const x = Math.min(cropStart.value.x, cropEnd.value.x)
    const y = Math.min(cropStart.value.y, cropEnd.value.y)
    const width = Math.abs(cropEnd.value.x - cropStart.value.x)
    const height = Math.abs(cropEnd.value.y - cropStart.value.y)
    
    // Darken outside crop area
    ctx.value.fillStyle = 'rgba(0, 0, 0, 0.5)'
    ctx.value.fillRect(0, 0, canvas.value.width, canvas.value.height)
    ctx.value.clearRect(x, y, width, height)
    ctx.value.drawImage(image.value, 0, 0, canvas.value.width, canvas.value.height)
    
    // Draw crop rectangle border
    ctx.value.strokeStyle = '#03b5aa'
    ctx.value.lineWidth = 2
    ctx.value.strokeRect(x, y, width, height)
  }
}

const getMousePos = (e: MouseEvent | TouchEvent) => {
  if (!canvas.value) return { x: 0, y: 0 }
  
  const rect = canvas.value.getBoundingClientRect()
  const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
  const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY
  
  return {
    x: clientX - rect.left,
    y: clientY - rect.top
  }
}

const startCrop = (e: MouseEvent | TouchEvent) => {
  e.preventDefault()
  const pos = getMousePos(e)
  cropStart.value = pos
  cropEnd.value = pos
  isCropping.value = true
}

const updateCrop = (e: MouseEvent | TouchEvent) => {
  if (!isCropping.value) return
  e.preventDefault()
  cropEnd.value = getMousePos(e)
  drawImage()
}

const endCrop = () => {
  isCropping.value = false
}

const cropAndSave = () => {
  if (!canvas.value || !image.value) return
  
  const x = Math.min(cropStart.value.x, cropEnd.value.x)
  const y = Math.min(cropStart.value.y, cropEnd.value.y)
  const width = Math.abs(cropEnd.value.x - cropStart.value.x)
  const height = Math.abs(cropEnd.value.y - cropStart.value.y)
  
  // If no crop area selected, use full image
  if (width === 0 || height === 0) {
    canvas.value.toBlob((blob) => {
      if (blob) emit('cropped', blob)
    }, 'image/jpeg', 0.9)
    return
  }
  
  // Create new canvas for cropped image
  const cropCanvas = document.createElement('canvas')
  const cropCtx = cropCanvas.getContext('2d')
  
  if (!cropCtx) return
  
  // Make it square (avatar)
  const size = Math.min(width, height)
  cropCanvas.width = size
  cropCanvas.height = size
  
  // Calculate scale factor
  const scaleX = image.value.width / canvas.value.width
  const scaleY = image.value.height / canvas.value.height
  
  // Draw cropped portion
  cropCtx.drawImage(
    image.value,
    x * scaleX,
    y * scaleY,
    size * scaleX,
    size * scaleY,
    0,
    0,
    size,
    size
  )
  
  // Convert to blob
  cropCanvas.toBlob((blob) => {
    if (blob) emit('cropped', blob)
  }, 'image/jpeg', 0.9)
}

const cancel = () => {
  emit('close')
}
</script>
