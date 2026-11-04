from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import urlparse
import re,json

root=Path(__file__).resolve().parents[1]
dist=root/'dist'
errors=[]
class Page(HTMLParser):
 def __init__(self):
  super().__init__(); self.ids=[]; self.anchors=[]; self.assets=[]; self.scenes=[]; self.h1=0; self.images=[]
 def handle_starttag(self,tag,attrs):
  a=dict(attrs)
  if 'id' in a:self.ids.append(a['id'])
  if tag=='section' and 'scene' in a.get('class','').split():self.scenes.append(a.get('id'))
  if tag=='h1':self.h1+=1
  if tag=='a' and a.get('href','').startswith('#'):self.anchors.append(a['href'][1:])
  if tag=='img':
   self.images.append(a)
   for candidate in a.get('srcset','').split(','):
    if candidate.strip():self.assets.append(candidate.strip().split()[0])
   if 'alt' not in a:errors.append('Image missing alt: '+a.get('src',''))
  for key in ['src','href']:
   v=a.get(key,'')
   if not v or v.startswith('#'):continue
   u=urlparse(v)
   if tag in ['img','script','link']:
    if u.scheme or u.netloc:errors.append('External runtime dependency: '+v)
    else:self.assets.append(v)
p=Page();p.feed((dist/'index.html').read_text())
if p.scenes!=['hero','akt1','akt2','akt3','akt4','ende']:errors.append('Six-scene order mismatch')
if p.h1!=1:errors.append('Expected one h1')
if len(p.ids)!=len(set(p.ids)):errors.append('Duplicate element ID')
for a in p.anchors:
 if a not in p.ids:errors.append('Unknown anchor: '+a)
for a in p.assets:
 if not (dist/a).is_file():errors.append('Missing asset: '+a)
for a in re.findall(r'url\([\'"]?([^\)\'\"]+)',(dist/'style.css').read_text()):
 if not (dist/a).is_file():errors.append('Missing CSS asset: '+a)
from PIL import Image
for a in p.images:
 src=dist/a['src']
 with Image.open(src) as im:
  if im.size!=(int(a['width']),int(a['height'])):errors.append('Image dimensions incorrect: '+a['src'])
from fontTools.ttLib import TTFont
coverage=set(TTFont(dist/'assets/fonts/song.woff').getBestCmap())
text=(dist/'index.html').read_text()+(dist/'app.js').read_text()
missing=sorted(set(c for c in text if '\u4e00'<=c<='\u9fff' and ord(c) not in coverage))
if missing:errors.append('Chinese font glyphs missing: '+''.join(missing))
result={'scenes':p.scenes,'images':len(p.images),'runtime_assets_checked':len(p.assets),'chinese_glyph_coverage':'complete' if not missing else 'incomplete','total_dist_bytes':sum(x.stat().st_size for x in dist.rglob('*') if x.is_file()),'errors':errors}
print(json.dumps(result,ensure_ascii=False,indent=2))
raise SystemExit(1 if errors else 0)
