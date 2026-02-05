from PIL import Image, ImageDraw

def create_icon(size):
    """Create a clipboard icon with gradient background"""
    # Create image with gradient background
    img = Image.new('RGB', (size, size))
    draw = ImageDraw.Draw(img)
    
    # Draw gradient background (purple to violet)
    for y in range(size):
        # Calculate color for this row
        ratio = y / size
        r = int(99 + (139 - 99) * ratio)
        g = int(102 + (92 - 102) * ratio)
        b = int(241 + (246 - 241) * ratio)
        draw.line([(0, y), (size, y)], fill=(r, g, b))
    
    # Calculate scale
    scale = size / 128
    
    # Draw clipboard board (white rectangle)
    board_x = int(20 * scale)
    board_y = int(30 * scale)
    board_w = int(88 * scale)
    board_h = int(88 * scale)
    draw.rectangle(
        [board_x, board_y, board_x + board_w, board_y + board_h],
        fill=(255, 255, 255)
    )
    
    # Draw clipboard clip (light gray rectangle at top)
    clip_x = int(45 * scale)
    clip_y = int(20 * scale)
    clip_w = int(38 * scale)
    clip_h = int(15 * scale)
    draw.rectangle(
        [clip_x, clip_y, clip_x + clip_w, clip_y + clip_h],
        fill=(226, 232, 240)
    )
    
    # Draw lines representing text/history
    line_width = int(60 * scale)
    line_height = max(1, int(4 * scale))
    line_spacing = int(12 * scale)
    start_x = int(34 * scale)
    start_y = int(50 * scale)
    
    for i in range(4):
        draw.rectangle(
            [start_x, start_y, start_x + line_width, start_y + line_height],
            fill=(99, 102, 241)
        )
        start_y += line_spacing
    
    return img

# Generate all icon sizes
sizes = [16, 32, 48, 128]

for size in sizes:
    icon = create_icon(size)
    filename = f'icons/icon{size}.png'
    icon.save(filename)
    print(f'Generated {filename}')

print('All icons generated successfully!')
