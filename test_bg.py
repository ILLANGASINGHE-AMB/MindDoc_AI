from PIL import Image
img = Image.open("favicon.ico").convert("RGBA")
width, height = img.size
print("Size:", width, height)
print("Top-left pixel:", img.getpixel((0, 0)))
