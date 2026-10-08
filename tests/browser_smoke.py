"""Optional Chromium smoke tests for the ten-sort interactive application."""
from pathlib import Path
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
with sync_playwright() as p:
 browser=p.chromium.launch(headless=True,**({'executable_path':'/usr/bin/chromium','args':['--no-sandbox']} if Path('/usr/bin/chromium').exists() else {}))
 for mode in ['bundle','standalone']:
  page=browser.new_page(viewport={'width':1360,'height':900})
  errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
  if mode=='bundle':
   html=(ROOT/'web/index.html').read_text().replace('<script defer src="./app.bundle.js"></script>','').replace('<link rel="stylesheet" href="./styles.css">','')
   page.set_content(html);page.add_style_tag(content=(ROOT/'web/styles.css').read_text());page.add_script_tag(content=(ROOT/'web/app.bundle.js').read_text())
  else:page.set_content((ROOT/'web/standalone.html').read_text())
  assert page.locator('[data-algo]').count()==10
  assert page.locator('.bar').count()==22
  page.locator('#customInput').fill('8,-3,5,-3,7')
  page.locator('#applyBtn').click()
  assert page.locator('.bar').count()==5 and page.locator('#sizeStat').inner_text()=='5'
  for key in ['bubble','selection','insertion','shell','merge','quick','heap','counting','radix','bucket']:
   page.locator('[data-algo="'+key+'"]').click()
   pressed=page.locator('[data-algo="'+key+'"]').get_attribute('aria-pressed')
   print('CHECK',mode,key,'pressed:',pressed,'errors:',errors,flush=True)
   assert pressed=='true',(mode,key,pressed,errors)
   assert page.locator('.bar').count()==5
   page.locator('#stepBtn').click()
   assert page.locator('#stepStat').inner_text().startswith('1/')
   page.locator('#resetBtn').click()
  page.locator('#themeBtn').click()
  assert page.locator('html').get_attribute('data-theme')=='dark'
  page.locator('#themeBtn').click()
  assert page.locator('html').get_attribute('data-theme')=='light'
  page.locator('#playBtn').click();page.wait_for_timeout(150);page.locator('#pauseBtn').click()
  page.locator('#sizeRange').fill('12');assert page.locator('.bar').count()==12
  page.locator('#shuffleBtn').click();assert page.locator('.bar').count()==12
  # Exercise a timeline jump, reverse navigation, negative zero baseline and synchronized inspector.
  page.locator('#customInput').fill('8,-3,5,-3,7')
  page.locator('#applyBtn').click()
  assert page.locator('.bar.negative').count()>=2
  assert page.locator('#zeroLine').get_attribute('style') is not None
  page.locator('[data-algo="quick"]').click()
  page.locator('#stepBtn').click()
  assert 'CURRENT PIVOT' in page.locator('#inspectorVisual').inner_text()
  page.locator('#timelineRange').fill('4')
  assert page.locator('#stepStat').inner_text().startswith('4/')
  page.locator('#backBtn').click()
  assert page.locator('#stepStat').inner_text().startswith('3/')
  page.locator('#tabCompare').click()
  page.locator('#compareBtn').click()
  assert page.locator('.compare-table tbody tr').count()==4
  page.locator('#tabCode').click()
  assert page.locator('#panelCode').is_visible()
  page.locator('#tabExplain').click()
  assert page.locator('#panelExplain').is_visible()
  page.set_viewport_size({'width':390,'height':844})
  assert page.locator('#timelineRange').is_visible()
  assert page.evaluate('document.documentElement.scrollWidth <= window.innerWidth + 2')
  assert not errors,errors
  print('PASS',mode,'10 algorithms, custom input, navigation, theme, play/pause, random arrays')
  page.close()
 browser.close()
