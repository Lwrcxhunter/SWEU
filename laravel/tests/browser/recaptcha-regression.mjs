import { build } from 'esbuild';
import { chromium } from '@playwright/test';
import assert from 'node:assert/strict';
const bundle = await build({ stdin: { contents: `import React from 'react'; import {createRoot} from 'react-dom/client'; import Widget from './resources/js/Components/RecaptchaWidget.jsx'; import {useForm} from '@inertiajs/react'; function App(){ const [value,setValue]=React.useState(''); const form=useForm({}); window.form=form; return <><input value={value} onChange={e=>setValue(e.target.value)}/><Widget siteKey="test" onChange={token=>window.token=token} onError={()=>{}} onExpired={()=>{}}/></>; } createRoot(document.getElementById('root')).render(<App/>);`, resolveDir: process.cwd(), loader:'jsx' }, bundle:true, write:false, format:'iife', define:{'process.env.NODE_ENV':'"test"'} });
const browser=await chromium.launch({headless:true});
try {
 const page=await browser.newPage();
 const errors=[]; page.on('pageerror', e=>errors.push(e.message));
 await page.setContent('<div id="root"></div>');
 await page.evaluate(()=>{window.renders=0;window.grecaptcha={render:(el,opts)=>{window.renders++;window.options=opts;return 0;},reset:()=>{}};});
 await page.addScriptTag({content:bundle.outputFiles[0].text});
 await page.waitForFunction(()=>window.renders===1);
 await page.evaluate(()=>window.options.callback('valid-token'));
 await page.locator('input').fill('student@example.test');
 await page.waitForTimeout(100);
 assert.equal(await page.evaluate(()=>window.renders),1);
 assert.equal(await page.evaluate(()=>window.token),'valid-token');
 await page.evaluate(()=>window.options['expired-callback']());
 assert.equal(await page.evaluate(()=>window.token),'');
 await page.evaluate(()=>{window.form.transform(data=>data); if(typeof window.form.post!=='function') throw new Error('Missing submit method');});
 assert.deepEqual(errors,[]);
 console.log('PASS: reCAPTCHA survives form edits, clears expired tokens, and form supports separate transform/submit.');
} finally { await browser.close(); }
