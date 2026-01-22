# AI Image Color Artifact Smoothing Tool

## Development Plan

### Vision

Build a deterministic, artist-facing web application that allows users to **remove AI-generated color artifacts** such as painterly noise, micro-hue jitter, and synthetic texture while **preserving intentional edges, form, and detail**.

The final output should resemble **human-created digital artwork**, not filtered AI output.

The system prioritizes:

* Preview-first workflows
* Color-space–aware smoothing
* Edge protection and inspection
* Fine-grained, explainable controls
* Incremental, testable progress

---

## Phase 0 — Foundation & Architecture (Completed)

**Goal:** Establish a modular, extensible base that separates concerns cleanly.

### Completed

* Modular JS architecture (`app.js`, `controls.js`, `sliders.js`, `math.js`, smoothing modules)
* Canvas-based rendering pipeline
* Preview-region workflow
* Bilateral RGB smoothing
* Optional palette quantization
* LAB conversion utilities
* Advanced, angular UI system
* Theme-capable CSS with variables and themes

### Validation

* Load large images without blocking UI
* Preview region applies changes independently
* Controls are deterministic and reversible

---

## Phase 1 — Preview Interaction & Spatial Awareness

**Goal:** Make it obvious *what* is being modified and *where*.

### Features

* Hover-based preview selection box on full image
* Fixed-size and adjustable preview window modes
* Click-to-load preview region
* Preview zoom controls (1×, 2×, 4×)
* Pixel grid toggle at high zoom levels

### Enhancements

* Preview box snaps to image bounds
* Optional aspect-ratio locking
* Visual indicator when preview is stale

### Testing

* Verify correct pixel mapping at different zoom levels
* Confirm preview accuracy against full image region

### Phase 1 Progress

* **Complete:** Hover-based preview selection box with bounds clamping
* **Complete:** Fixed-size vs drag-to-size preview window modes with optional aspect lock
* **Complete:** Click-to-load preview region into a separate preview canvas (full image remains unchanged)
* **Complete:** Preview zoom controls (1×, 2×, 4×) with pixel grid toggle at higher zoom
* **Complete:** Preview state indicators (active/stale) and region metadata display
* **Complete:** Sticky preview header/canvas with scrollable controls; active region frame persists on full image

---

## Phase 2 — LAB Chroma-Only Smoothing (Critical)

**Goal:** Remove painterly color noise without destroying detail.

### Features

* LAB-space bilateral filtering
* Independent smoothing of A/B channels
* Luminance (L) preservation by default
* Adjustable chroma smoothing strength
* Safe upper bounds to prevent color collapse

### UI

* “Chroma Smooth” primary control
* Advanced per-channel sliders (A strength, B strength)
* Toggle: RGB smoothing vs LAB smoothing

### Testing

* Side-by-side RGB vs LAB preview
* Stress test on highly textured AI images
* Ensure no luminance bleeding

---

## Phase 3 — Edge Detection & Protection

**Goal:** Prevent smoothing from destroying intentional edges.

### Features

* Sobel or Scharr edge detection
* Edge strength map generation
* Edge-aware smoothing masks
* Adjustable edge sensitivity
* Edge preservation strength control

### Visualization

* Edge overlay toggle in preview
* Adjustable overlay opacity
* Edge-only debug view

### Testing

* Verify edges remain intact under aggressive smoothing
* Confirm overlays match detected edges accurately

---

## Phase 4 — Edge Smoothing & Stylization Controls

**Goal:** Allow *intentional* refinement of edges, not just protection.

### Features

* Edge softening (reduce harsh AI outlines)
* Edge thinning or thickening
* Edge tracing overlay (ink-like preview)
* Separate controls for internal vs external edges

### Use Cases

* Reduce AI “sticker” outlines
* Prepare images for line-art or paint-over workflows

### Testing

* Validate edge refinement does not introduce halos
* Confirm compatibility with chroma smoothing

---

## Phase 5 — Advanced Color Flattening & Palette Control

**Goal:** Help users achieve controlled, human-like color consistency.

### Features

* Adaptive palette clustering (k-means or median-cut)
* Per-region palette snapping
* Soft quantization with falloff
* Preserve dominant hues

### UI

* Palette size target
* “Snap Strength” vs hard quantization
* Palette preview swatches

### Testing

* Ensure no banding artifacts
* Validate palette stability across preview regions

---

## Phase 6 — Presets, Comparison & Workflow Tools

**Goal:** Make iteration fast and confidence high.

### Features

* Preset save/load (JSON)
* Before/after toggle
* Split-view comparison
* History stack (undo/redo)
* Reset per-section controls

### UX Enhancements

* Tooltips and inline hints
* “Recommended starting points” presets
* Warnings for destructive settings

### Testing

* Preset compatibility across versions
* Undo accuracy under complex pipelines

---

## Phase 7 — Performance & Scalability

**Goal:** Handle large images smoothly and predictably.

### Features

* Web Worker offloading for heavy computation
* Progressive preview updates
* Resolution-aware processing
* Optional downsampled preview processing

### Testing

* Benchmark large images (4k–8k)
* Verify UI responsiveness under load

---

## Phase 8 — Final Output & Export

**Goal:** Produce clean, predictable results suitable for production use.

### Features

* Apply-to-full-image pipeline
* Export to PNG, JPEG, WebP
* Metadata option (processing notes)
* Color profile handling (sRGB)

### Validation

* Output matches preview within tolerance
* No unexpected color shifts
* No added artifacts

---

## Final State Definition

The completed application will allow users to:

* Inspect AI-generated images at pixel-level detail
* Identify unwanted color artifacts clearly
* Smooth and flatten colors **without blurring form**
* Preserve or refine edges intentionally
* Iterate safely using previews and presets
* Export results that resemble **human-created digital artwork**

The system remains:

* Deterministic
* Explainable
* Artist-controlled
* Extensible
