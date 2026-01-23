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
* **Complete:** Live preview updates on slider change with busy/progress feedback

---

## Phase 2 — LAB Chroma-Only Smoothing (Critical)

**Goal:** Remove painterly color noise without destroying detail.

### Features

* LAB-space bilateral filtering
* Independent smoothing of A/B channels
* Luminance (L) preservation by default
* Adjustable chroma smoothing strength
* Safe upper bounds to prevent color collapse

### Correction Features and Options (Robust Set)

* Chroma-only strength (primary) with separate A/B sliders
* Radius (spatial sigma) and range (color sigma) for bilateral control
* Luminance lock (on by default) with optional limited L blending
* Chroma clamp to prevent saturation collapse or hue drift
* Adaptive chroma smoothing based on local color variance
* Protect-skin tones toggle (hue-range guard with falloff)
* Preserve highlights/shadows (L-based threshold mask)
* Neutral protection (avoid shifting low-saturation regions)
* Artifact boost view (preview-only exaggeration of chroma noise)
* Before/after split and A/B quick toggle in preview
* Safe preset tiers: Subtle / Balanced / Aggressive

### UI

* “Chroma Smooth” primary control
* Advanced per-channel sliders (A strength, B strength)
* Toggle: RGB smoothing vs LAB smoothing

### Testing

* Side-by-side RGB vs LAB preview
* Stress test on highly textured AI images
* Ensure no luminance bleeding

### Phase 2 Progress

* **Complete:** LAB chroma-only smoothing pipeline with L lock and per-channel A/B control
* **Complete:** Adaptive chroma smoothing, chroma clamp, neutral/highlight protection, and skin-tone guard
* **Complete:** Preview comparison modes (split + A/B) and artifact-boost view (preview-only)
* **Complete:** RGB vs LAB smoothing mode toggle with dynamic UI visibility
* **Complete:** Slider UI consolidated to compact range+value readouts with advanced LAB options toggle
* **Complete:** Draggable split handle in preview + full-image A/B toggle (original vs applied)
* **Next:** Validate defaults on varied AI images and tune preset thresholds

---

## Phase 3 — Edge Detection, Protection & Outlining

### Goal

Preserve and strengthen **intentional structural edges** in AI-generated images while preventing color smoothing from degrading form.

Phase 3 introduces **edge maps as a tangible data layer**, not just an internal heuristic.

---

### Core Concepts Introduced

* Edges are treated as **derived data**, not just constraints
* Edge maps can be:

  * visualized
  * tuned
  * reused
  * optionally merged back into the image
* Users gain confidence by *seeing* what the system believes is an edge

---

## Features

### 1. Edge Detection

Implement grayscale edge detection using:

* Sobel (default)
* Scharr (optional toggle for higher fidelity)

Controls:

* Edge sensitivity / threshold
* Kernel selection (Sobel vs Scharr)
* Noise suppression (pre-blur radius)

Output:

* Edge strength map (normalized 0–1)

---

### 2. Edge Strength Map Generation

Generate and store an **edge strength buffer** per preview region:

* Single-channel float map
* Represents likelihood and intensity of an edge
* Used downstream by:

  * smoothing masks
  * overlays
  * outline generation

This buffer must be reusable across operations.

---

### 3. Edge-Aware Smoothing Masks

Use the edge map to control smoothing behavior:

* Reduce smoothing across strong edges
* Allow smoothing within flat regions
* Adjustable falloff curve

Controls:

* Edge preservation strength
* Edge influence radius
* Linear vs smoothstep falloff

This ensures color flattening does not bleed across form boundaries.

---

### 4. Image Tracing / Outline Extraction (NEW)

Derive **explicit outlines** from the edge strength map.

Features:

* Binary or weighted outline extraction
* Adjustable outline thickness
* Threshold-based tracing
* Optional edge thinning

Outputs:

* Raster outline layer (grayscale or alpha)
* Preview-only until explicitly merged

This is *not* vectorization yet.
It is controlled raster outlining suitable for strengthening borders.

---

### 5. Outline Overlay & Merge Controls

Allow outlines to be used in three ways:

1. **Overlay Only**

   * Preview visualization
   * Adjustable opacity
   * Color selection (black, darken, accent color)

2. **Non-Destructive Layer**

   * Stored separately
   * Can be toggled on/off
   * Used for inspection and tuning

3. **Merge into Image**

   * Strengthen borders
   * Reinforce shape readability
   * Adjustable blend mode:

     * Multiply
     * Darken
     * Overlay
     * Custom edge-darken

Controls:

* Outline opacity
* Blend mode
* Merge strength

---

## Visualization

### Edge Tools Panel

* Toggle: Edge detection on/off
* Toggle: Edge overlay
* Toggle: Outline overlay
* Slider: Overlay opacity
* Dropdown: Overlay mode (edges / outlines / both)

### Debug Views

* Edge-only view (black on white)
* Strength heatmap
* Outline-only view

These views are preview-only and never destructive.

---

## Testing

### Functional Tests

* Aggressive color smoothing does not destroy outlines
* Edge overlays align pixel-perfect with image features
* Outline extraction respects thresholds

### Visual Tests

* Compare AI image before/after with outlines enabled
* Verify outlines enhance readability without cartooning
* Confirm no haloing or double edges

### Regression Safety

* Disabling all edge tools returns smoothing behavior to Phase 2 behavior
* Edge layer is never applied unless explicitly merged

---

## Why This Belongs in Phase 3 (Not Later)

* Edge detection already exists conceptually in Phase 3
* Outlines are a **direct derivative** of edge maps
* This gives users confidence and control early
* It prevents the “black box smoothing” problem
* It creates a foundation for later vector or paint workflows without committing to them

---

## Explicitly Deferred (Not Phase 3)

* Vector tracing (SVG paths)
* Bézier simplification
* Line-art export
* Brush-based repainting
* ML-based semantic edge classification


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
