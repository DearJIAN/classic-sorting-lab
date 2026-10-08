"""Optional integration smoke test: pip install playwright and install Chromium."""
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT=Path(__file__).resolve().parents[1]
standalone=(ROOT/'web/standalone.html').read_text()
results=[]

with sync_playwright() as p:
    browser=p.chromium.launch(headless=True,**({'executable_path':'/usr/bin/chromium','args':['--no-sandbox']} if Path('/usr/bin/chromium').exists() else {}))
    for method in ('bundle','standalone'):
        page=browser.new_page(viewport={'width':1360,'height':920})
        errs=[]
        page.on('pageerror',lambda e: errs.append(str(e)))
        page.on('console',lambda m: errs.append('console:'+m.text) if m.type=='error' else None)
        if method=='bundle':
            # Test classic browser script without navigation; this environment blocks localhost/file://.
            template=(ROOT/'web/index.html').read_text().replace('<script defer src="./app.bundle.js"></script>','').replace('<link rel="stylesheet" href="./styles.css">','')
            page.set_content(template,wait_until='load')
            page.add_style_tag(content=(ROOT/'web/styles.css').read_text())
            page.add_script_tag(content=(ROOT/'web/app.bundle.js').read_text())
        else:page.set_content(standalone,wait_until='load')
        assert page.locator('.bar').count()==22, (method,'initial bars count',page.locator('.bar').count())
        page.locator('#customInput').fill('8, -3, 5, -3, 7')
        page.locator('#applyBtn').click()
        assert page.locator('.bar').count()==5
        assert page.locator('#sizeStat').inner_text()=='5'
        assert '成功载入 5 个整数' in page.locator('#inputMessage').inner_text()
        results.append(method+': custom 5 integers loaded')
        page.locator('#stepBtn').click()
        assert page.locator('#compStat').inner_text()=='1'
        results.append(method+': single comparison advances')
        page.locator('#resetBtn').click()
        assert page.locator('#compStat').inner_text()=='0'
        page.locator('#customInput').fill('abc')
        page.locator('#applyBtn').click()
        assert '请输入 2–48' in page.locator('#inputMessage').inner_text()
        assert page.locator('.bar').count()==5
        results.append(method+': validation rejects invalid input')
        page.locator('#customInput').fill('3, 2, 1')
        page.locator('#customInput').press('Enter')
        assert page.locator('#sizeStat').inner_text()=='3'
        page.locator('#playBtn').click()
        page.wait_for_timeout(200)
        assert page.locator('#statusText').inner_text() in ['正在排序','排序完成']
        if page.locator('#statusText').inner_text()=='正在排序':
            page.locator('#pauseBtn').click()
            assert page.locator('#statusText').inner_text()=='已暂停'
        results.append(method+': Enter, play/pause work')
        page.locator('#sizeRange').fill('12')
        assert page.locator('.bar').count()==12
        page.locator('#preset').select_option('reverse')
        assert page.locator('.bar').count()==12
        page.locator('#shuffleBtn').click()
        assert '重新生成数组' in page.locator('#activity').inner_text()
        results.append(method+': slider, preset and regeneration work')
        page.locator('#sizeRange').fill('2')
        assert page.locator('.bar').count()==2
        page.screenshot(path=str(ROOT/f'docs/smoke-{method}.png'),full_page=True)
        assert not errs, (method,errs)
        results.append(method+': no JS console errors')
        page.close()
    browser.close()
for r in results: print('PASS',r)
print('TOTAL',len(results),'browser scenarios passed')
