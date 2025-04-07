// ==UserScript==
// @name         Udemy自动翻译助手
// @namespace    http://tampermonkey.net/
// @version      1.2
// @description  将译文内容替换到视频字幕中，配合沉浸式翻译使用。可选双行显示，可选支持双语显示。
// @author       ME
// @match        https://*.udemy.com/course/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=udemy.com
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_registerMenuCommand
// @grant        GM_addStyle
// @updateURL    https://raw.githubusercontent.com/MNDIA/TEMP/main/tools/UdemyMover.user.js
// @downloadURL  https://raw.githubusercontent.com/MNDIA/TEMP/main/tools/UdemyMover.user.js
// ==/UserScript==

(function() {
    'use strict';
    

    const DEFAULT_SETTINGS = {
        enabled: true,
        bilingualismWithlinebreaks: true,
        embeddedSubtitles: '.captions-display--captions-cue-text--XXXXX',
        bottomSubtitles: '.well--text--XX-XX', 
        translationTarget: 'p[data-purpose="transcript-cue-active"] span'
    };
    
    let settings = GM_getValue('udemyTranslatorSettings', DEFAULT_SETTINGS);
    
    GM_addStyle(`
        .udemy-translator-settings {
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: #ffffff;
            padding: 24px;
            border-radius: 6px;
            box-shadow: 0 8px 24px rgba(149, 157, 165, 0.2);
            z-index: 9999;
            width: 350px;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;
            color: #24292e;
            border: 1px solid #e1e4e8;
        }
        .udemy-translator-settings h2 {
            margin-top: 0;
            margin-bottom: 16px;
            font-size: 20px;
            font-weight: 600;
            border-bottom: 1px solid #eaecef;
            padding-bottom: 8px;
        }
        .udemy-translator-settings .setting-group {
            margin-bottom: 16px;
        }
        .udemy-translator-settings label {
            display: block;
            margin: 8px 0;
            font-weight: 500;
        }
        .udemy-translator-settings .toggle-wrapper {
            display: flex;
            align-items: center;
            margin: 16px 0;
        }
        .udemy-translator-settings .toggle-label {
            margin-left: 8px;
            font-weight: 500;
        }
        .udemy-translator-settings .toggle {
            position: relative;
            display: inline-block;
            width: 40px;
            height: 20px;
        }
        .udemy-translator-settings .toggle input {
            opacity: 0;
            width: 0;
            height: 0;
        }
        .udemy-translator-settings .toggle-slider {
            position: absolute;
            cursor: pointer;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background-color: #ccc;
            transition: .4s;
            border-radius: 20px;
        }
        .udemy-translator-settings .toggle-slider:before {
            position: absolute;
            content: "";
            height: 16px;
            width: 16px;
            left: 2px;
            bottom: 2px;
            background-color: white;
            transition: .4s;
            border-radius: 50%;
        }
        .udemy-translator-settings input:checked + .toggle-slider {
            background-color: #2ea44f;
        }
        .udemy-translator-settings input:checked + .toggle-slider:before {
            transform: translateX(20px);
        }
        .udemy-translator-settings input[type="text"] {
            width: 100%;
            padding: 6px 8px;
            font-size: 14px;
            line-height: 20px;
            color: #24292e;
            vertical-align: middle;
            background-color: #ffffff;
            border: 1px solid #e1e4e8;
            border-radius: 6px;
            box-sizing: border-box;
            margin-top: 4px;
        }
        .udemy-translator-settings input[type="text"]:focus {
            outline: none;
            border-color: #0366d6;
            box-shadow: 0 0 0 3px rgba(3, 102, 214, 0.3);
        }
        .udemy-translator-settings .buttons {
            margin-top: 16px;
            text-align: right;
            border-top: 1px solid #eaecef;
            padding-top: 16px;
        }
        .udemy-translator-settings button {
            padding: 5px 16px;
            font-size: 14px;
            font-weight: 500;
            line-height: 20px;
            white-space: nowrap;
            vertical-align: middle;
            cursor: pointer;
            user-select: none;
            border: 1px solid;
            border-radius: 6px;
            transition: .2s;
            margin-left: 8px;
        }
        .udemy-translator-settings .btn-cancel {
            color: #24292e;
            background-color: #fafbfc;
            border-color: rgba(27, 31, 35, 0.15);
        }
        .udemy-translator-settings .btn-save {
            color: #ffffff;
            background-color: #2ea44f;
            border-color: rgba(27, 31, 35, 0.15);
        }
        .udemy-translator-settings .btn-cancel:hover {
            background-color: #f3f4f6;
        }
        .udemy-translator-settings .btn-save:hover {
            background-color: #2c974b;
        }
        .udemy-translator-settings .helper-text {
            font-size: 12px;
            color: #586069;
            margin-top: 4px;
        }
    `);
    
    GM_registerMenuCommand("⚙️ 设置", showSettings);
    GM_registerMenuCommand("🔄 重启翻译", initTranslator);
    
    let observer = null;
    
    function showSettings() {
        const existingPanel = document.querySelector('.udemy-translator-settings');
        if (existingPanel) {
            existingPanel.remove();
            return;
        }
        
        const panel = document.createElement('div');
        panel.className = 'udemy-translator-settings';
        panel.innerHTML = `
        <h2>Udemy自动翻译助手设置</h2>
        
        <div class="toggle-wrapper">
            <label class="toggle">
                <input type="checkbox" id="translator-enabled" ${settings.enabled ? 'checked' : ''}>
                <span class="toggle-slider"></span>
            </label>
            <span class="toggle-label">字幕列表自动替换视频字幕</span>
        </div>

        <div class="toggle-wrapper">
            <label class="toggle">
                <input type="checkbox" id="bilingualismWithlinebreaks-enabled" ${settings.bilingualismWithlinebreaks ? 'checked' : ''}>
                <span class="toggle-slider"></span>
            </label>
            <span class="toggle-label">双文时使用双行显示</span>
        </div>
        
        <div class="setting-group">
            <label for="embeddedSubtitles">视频内嵌字幕元素:</label>
            <input type="text" id="embeddedSubtitles" value="${settings.embeddedSubtitles}" placeholder=".captions-display--captions-cue-text--XXXXX">
            <div class="helper-text">XXXXX替换自己的</div>
        </div>
        
        <div class="setting-group">
            <label for="bottomSubtitles">视频底部字幕元素:</label>
            <input type="text" id="bottomSubtitles" value="${settings.bottomSubtitles}" placeholder=".well--text--XX-XX">
            <div class="helper-text">XX-XX替换自己的</div>
        </div>
        
        <div class="setting-group">
            <label for="translationTarget">字幕列表即刻元素:</label>
            <input type="text" id="translationTarget" value="${settings.translationTarget.replace(/"/g, '&quot;')}" placeholder="p[data-purpose=&quot;transcript-cue-active&quot;] span">
            <div class="helper-text">一般不需要替换</div>
        </div>
        
        <div class="buttons">
            <button id="translator-cancel" class="btn-cancel">取消</button>
            <button id="translator-save" class="btn-save">保存</button>
        </div>
        `;
        
        document.body.appendChild(panel);
        
        document.getElementById('translator-cancel').addEventListener('click', () => {
            panel.remove();
        });
        
        document.getElementById('translator-save').addEventListener('click', () => {
          
            settings.enabled = document.getElementById('translator-enabled').checked;
            settings.bilingualismWithlinebreaks = document.getElementById('bilingualismWithlinebreaks-enabled').checked;
            settings.embeddedSubtitles = document.getElementById('embeddedSubtitles').value;
            settings.bottomSubtitles = document.getElementById('bottomSubtitles').value;
            settings.translationTarget = document.getElementById('translationTarget').value;
            
            GM_setValue('udemyTranslatorSettings', settings);
            panel.remove();
            
            initTranslator();
        });
    }
    
    function replaceWithTranslation() {
        if (!settings.enabled) return false;
        
       
        const captionElement = document.querySelector(settings.embeddedSubtitles);
        
     
        const secondaryCaptionElement = document.querySelector(settings.bottomSubtitles);
        
        
        const translationElement = document.querySelector(settings.translationTarget);//p[data-purpose="transcript-cue-active"] span
        
      
        let targetCaptionElement = captionElement || secondaryCaptionElement;
        
        if (!targetCaptionElement) {
            console.error('未找到字幕元素');
            return false;
        }
        
        if (!translationElement) {
            console.error('未找到译文元素');
            return false;
        }
        
        
        const innerTranslation = translationElement.querySelector('.immersive-translate-target-inner');
        let newContent = '';
        
        if (innerTranslation) {
            
            const translatedText = innerTranslation.textContent.trim();

           
            const fullText = translationElement.textContent.trim();

           
            if (settings.bilingualismWithlinebreaks && fullText.length > translatedText.length) {
            
                const originalText = fullText.replace(translatedText, '').trim();

                if (originalText) {
                   
                    newContent = translatedText + '\n' + originalText;
                } else {
                    newContent = translatedText;
                }
            } else {
                newContent = fullText;
            }
        } else {
            
            newContent = translationElement.textContent;
        }
        
        
        if (targetCaptionElement.textContent === newContent) {
            return true;
        }
        
      
        targetCaptionElement.textContent = newContent;
        return true;
    }


    function startAutoReplace() {
        if (!settings.enabled) return;
        
      
        stopAutoReplace();
        
      
        replaceWithTranslation();
        
    
        observer = new MutationObserver(() => {
            replaceWithTranslation();
        });
        
        
        observer.observe(document.body, { 
            childList: true,
            subtree: true,
            characterData: true 
        });
        
        console.log('✅ Udemy自动翻译助手已启动');
    }


    function stopAutoReplace() {
        if (observer) {
            observer.disconnect();
            observer = null;
            console.log('❌ Udemy自动翻译助手已停止');
        }
    }


    function initTranslator() {
        if (settings.enabled) {
            startAutoReplace();
        } else {
            stopAutoReplace();
        }
    }

 
    function init() {
        setTimeout(initTranslator, 2000);
    }
    
   
    init();
})();
