"""Rebuild the site's Chinese WOFF after editing copy. Requires fontTools."""
from pathlib import Path
from tempfile import gettempdir
from urllib.request import urlopen
from fontTools import subset
from fontTools.ttLib import TTFont
root=Path(__file__).resolve().parents[1]
cache=Path(gettempdir())/'hegel-noto-serif-sc.ttf'
if not cache.exists():
 cache.write_bytes(urlopen('https://raw.githubusercontent.com/google/fonts/main/ofl/notoserifsc/NotoSerifSC%5Bwght%5D.ttf').read())
text=''.join((root/'dist'/f).read_text() for f in ['index.html','app.js'])
font=TTFont(cache);options=subset.Options();options.flavor='woff'
subsetter=subset.Subsetter(options=options);subsetter.populate(text=text);subsetter.subset(font)
font.flavor='woff';font.save(root/'dist/assets/fonts/song.woff')
print('Updated dist/assets/fonts/song.woff')
