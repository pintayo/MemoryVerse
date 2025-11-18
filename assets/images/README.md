# Story Mode Preview Image

## How to Add Your Story Mode Image

1. **Create or prepare your image:**
   - Aspect ratio: **9:14** (e.g., 900x1400 pixels or 1080x1680 pixels)
   - Format: PNG or JPG
   - The image should represent the Life of Jesus theme
   - Make sure the bottom portion is darker or less busy, as text overlays will appear there

2. **Save the file:**
   - Filename: `story-mode-preview.png`
   - Location: `assets/images/story-mode-preview.png`

3. **Update HomeScreen.tsx:**
   - Replace the `<View style={styles.storyModeImageBackground}>` with `<ImageBackground>`
   - Use: `source={require('../../assets/images/story-mode-preview.png')}`
   - Add `resizeMode="cover"`

## Example Code

Replace lines 327-334 in `src/screens/HomeScreen.tsx` with:

```tsx
<ImageBackground
  source={require('../../assets/images/story-mode-preview.png')}
  style={styles.storyModeImageBackground}
  resizeMode="cover"
>
```

And change line 349 from `</View>` to `</ImageBackground>`

## Current Status

Currently using an SVG cross placeholder. Upload your image and update the code as described above to use your custom Story Mode preview image.
