import re,os,sys
d=os.path.dirname(os.path.abspath(__file__))
h=open(f'{d}/index.html').read()
js=''.join(f"<script>\n{open(f'{d}/{n}.js').read()}\n</script>\n" for n in ['assets','data','game','ui','mobile'])
h=re.sub(r'<!--SCRIPTS-->.*?(?=</body>)', lambda m: js, h, flags=re.S)
open(f'{d}/cyberpix.html','w').write(h)
print('built',len(h))
