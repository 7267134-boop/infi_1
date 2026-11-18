/**
 * ==============================================================================
 * course-modals.js — מנוע ההודעות, ההדרכה והפצת הקורס
 * חשבון אינפיניטסימלי 1 (20474) • האוניברסיטה הפתוחה
 * ==============================================================================
 * תכונות:
 * 1. חלון כניסה ראשונה (Welcome & Roadmap Modal):
 *    - הסבר מעמיק על האתר ומטרותיו (100% חינם לרווחת הסטודנטים).
 *    - פירוט אינטראקטיבי של 6 כלי הלימוד והתרגול באתר (8 הפרקים, 44 משפטי ההוכחה,
 *      שאלות אמריקאיות, מחברת סיכום, משחק אינפי, ומאגר מבחנים).
 *    - אקורדיון אינטראקטיבי: תמצית קצרה לכל פריט + הרחבה מלאה בלחיצה עם קישור ישיר.
 * 
 * 2. חלון שיתוף ומאגר הקורסים הראשי (Recurring 5-Day Share & Hub Modal):
 *    - קופץ למשתמשים חוזרים (מעל 24-48 שעות מהכניסה הראשונה).
 *    - חוזר באופן רציף כל 5 ימים בלבד (ללא הטרדה חוזרת בכל רענון).
 *    - גודל בינוני וקריא, עיצוב Glassmorphism יפהפה וקליל עם סמיילי.
 *    - כפתור העתקת קישור מהיר ללוח עם פידבק ויזואלי.
 *    - כפתור מעבר ישיר למאגר הקורסים הראשי (https://all-the-courses.pages.dev/).
 * 
 * 3. ניהול מצב מקומי מלא (Local Storage) - ללא איסוף מידע וללא צורך בשרת.
 * ==============================================================================
 */

(function () {
    'use strict';

    // מניעת טעינה כפולה
    if (window.__INFI_MODALS_INITIALIZED__) return;
    window.__INFI_MODALS_INITIALIZED__ = true;

    // מפתחות LocalStorage
    const STORAGE_KEYS = {
        FIRST_VISIT: 'infi_first_visit_timestamp',
        WELCOME_SHOWN: 'infi_welcome_modal_shown',
        SHARE_LAST_SHOWN: 'infi_share_modal_last_shown_timestamp',
        VISIT_COUNT: 'infi_visit_count'
    };

    const ONE_DAY_MS = 24 * 60 * 60 * 1000;
    const FIVE_DAYS_MS = 5 * ONE_DAY_MS;
    const MAIN_COURSES_HUB_URL = 'https://all-the-courses.pages.dev/';

    /* ==========================================================================
       1. הזרקת סגנונות CSS ייעודיים (Scoped & Glassmorphism)
       ========================================================================== */
    function injectStyles() {
        if (document.getElementById('infi-modals-styles')) return;

        const styleEl = document.createElement('style');
        styleEl.id = 'infi-modals-styles';
        styleEl.textContent = `
            /* אנימציות כניסה ויציאה */
            @keyframes infiFadeInBackdrop {
                from { opacity: 0; }
                to { opacity: 1; }
            }
            @keyframes infiScaleInModal {
                from { opacity: 0; transform: scale(0.93) translateY(18px); }
                to { opacity: 1; transform: scale(1) translateY(0); }
            }
            @keyframes infiPulseGlow {
                0%, 100% { box-shadow: 0 0 20px rgba(2, 132, 199, 0.22); }
                50% { box-shadow: 0 0 35px rgba(2, 132, 199, 0.35); }
            }
            @keyframes infiRainbowSpin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
            @keyframes infiToastSlide {
                from { opacity: 0; transform: translate(-50%, -20px); }
                to { opacity: 1; transform: translate(-50%, 0); }
            }

            /* מעטפת הרקע (Backdrop) */
            .infi-backdrop {
                position: fixed;
                inset: 0;
                background: rgba(15, 23, 42, 0.68);
                backdrop-filter: blur(4px);
                -webkit-backdrop-filter: blur(4px);
                z-index: 99999;
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 16px;
                opacity: 0;
                animation: infiFadeInBackdrop 0.25s ease-out forwards;
                font-family: 'Heebo', 'Rubik', system-ui, -apple-system, sans-serif;
                direction: rtl;
                text-align: right;
                box-sizing: border-box;
                -webkit-font-smoothing: antialiased;
                -moz-osx-font-smoothing: grayscale;
            }

            .infi-backdrop * {
                box-sizing: border-box;
            }

            /* כרטיס המודאל - מותאם באופן מלא לפלטת הצבעים של הקורס */
            .infi-modal-card {
                position: relative;
                width: 100%;
                background: #ffffff;
                border: 1.5px solid #bae6fd;
                border-radius: 22px;
                box-shadow: 0 20px 50px -10px rgba(15, 23, 42, 0.4), 0 0 25px rgba(2, 132, 199, 0.22);
                display: flex;
                flex-direction: column;
                max-height: 88vh;
                opacity: 0;
                animation: infiScaleInModal 0.3s ease-out forwards;
                overflow: hidden;
                transform: none !important;
            }

            /* גדלים מותאמים */
            .infi-modal-card.welcome-size {
                max-width: 800px;
            }
            .infi-modal-card.share-size {
                max-width: 520px;
            }

            /* כפתור סגירה X */
            .infi-close-btn {
                position: absolute;
                top: 14px;
                left: 14px;
                width: 36px;
                height: 36px;
                border-radius: 50%;
                background: #f1f5f9;
                border: 1px solid #cbd5e1;
                color: #334155;
                font-size: 18px;
                font-weight: 700;
                line-height: 1;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: all 0.2s ease;
                z-index: 10;
            }
            .infi-close-btn:hover {
                background: #ef4444;
                color: #ffffff;
                border-color: #ef4444;
                transform: rotate(90deg);
            }

            /* כותרת עליונה */
            .infi-header {
                padding: 22px 26px 14px 26px;
                border-bottom: 1px solid #bae6fd;
                background: linear-gradient(180deg, #f0f9ff 0%, #ffffff 100%);
                position: relative;
                flex-shrink: 0;
            }

            .infi-badge {
                display: inline-flex;
                align-items: center;
                gap: 6px;
                padding: 4px 12px;
                border-radius: 9999px;
                font-size: 12.5px;
                font-weight: 800;
                background: #f0f9ff;
                color: #0369a1;
                border: 1px solid #bae6fd;
                margin-bottom: 8px;
            }

            .infi-title {
                margin: 0 0 4px 0;
                font-size: 20px;
                font-weight: 900;
                color: #0369a1;
                line-height: 1.3;
            }

            .infi-subtitle {
                margin: 0;
                font-size: 13.5px;
                color: #475569;
                line-height: 1.45;
            }

            /* גוף המודאל עם גלילה נעימה */
            .infi-body {
                padding: 18px 26px;
                overflow-y: auto;
                -webkit-overflow-scrolling: touch;
                flex-grow: 1;
            }

            /* כרטיס מדריך ראשי מעוצב */
            .infi-guide-card {
                background: linear-gradient(135deg, #f0f9ff 0%, #ffffff 100%);
                border: 1px solid #bae6fd;
                border-radius: 14px;
                padding: 14px 16px;
                margin-bottom: 18px;
            }

            .infi-guide-title {
                font-size: 14.5px;
                font-weight: 800;
                color: #0369a1;
                margin-bottom: 4px;
                display: flex;
                align-items: center;
                gap: 8px;
            }

            .infi-guide-text {
                font-size: 13.5px;
                color: #334155;
                line-height: 1.55;
                margin: 0;
            }

            /* רשימת האקורדיונים - פריטים סגורים במבנה מעטפה ("תיבת מכתב") */
            .infi-acc-container {
                display: flex;
                flex-direction: column;
                gap: 10px;
                margin-bottom: 12px;
            }

            .infi-acc-item {
                border: 1.5px solid #e2e8f0;
                background: #ffffff;
                border-radius: 14px;
                transition: border-color 0.2s ease, box-shadow 0.2s ease, background-color 0.2s ease;
                overflow: hidden;
                flex-shrink: 0;
            }
            .infi-acc-item:hover {
                border-color: #bae6fd;
                background: #f0f9ff;
                box-shadow: 0 4px 14px rgba(2, 132, 199, 0.22);
            }
            .infi-acc-item.open {
                border-color: #0284c7;
                box-shadow: 0 4px 18px rgba(2, 132, 199, 0.22);
                background: #ffffff;
            }

            /* כפתור כותרת אקורדיון */
            .infi-acc-header {
                width: 100%;
                background: none;
                border: none;
                padding: 13px 16px;
                display: flex;
                align-items: center;
                justify-content: space-between;
                cursor: pointer;
                text-align: right;
                gap: 12px;
                font-family: inherit;
                transition: background-color 0.15s ease;
            }

            .infi-acc-header-left {
                display: flex;
                align-items: center;
                gap: 12px;
                flex: 1;
                min-width: 0;
            }

            .infi-acc-icon {
                font-size: 20px;
                width: 38px;
                height: 38px;
                border-radius: 10px;
                background: #f0f9ff;
                border: 1px solid #bae6fd;
                display: flex;
                align-items: center;
                justify-content: center;
                flex-shrink: 0;
            }

            .infi-acc-header-text {
                flex: 1;
                min-width: 0;
            }

            .infi-acc-name {
                font-size: 14.5px;
                font-weight: 800;
                color: #0f172a;
                line-height: 1.35;
                margin-bottom: 2px;
            }
            .infi-acc-item.open .infi-acc-name {
                color: #0369a1;
            }

            .infi-acc-snippet {
                font-size: 12.5px;
                color: #64748b;
                line-height: 1.4;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
            }

            .infi-acc-chevron {
                font-size: 12px;
                color: #94a3b8;
                width: 28px;
                height: 28px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: transform 0.25s ease, color 0.2s ease, background 0.2s ease;
                flex-shrink: 0;
            }
            .infi-acc-item.open .infi-acc-chevron {
                transform: rotate(180deg);
                color: #0284c7;
                background: #f0f9ff;
            }

            /* תוכן אקורדיון מורחב */
            .infi-acc-content {
                display: none;
                padding: 0 18px 16px 18px;
                animation: infiFadeInBackdrop 0.2s ease-out forwards;
            }
            .infi-acc-item.open .infi-acc-content {
                display: block;
            }

            .infi-acc-desc {
                font-size: 13.5px;
                color: #0f172a;
                line-height: 1.65;
                padding-top: 12px;
                border-top: 1px dashed #bae6fd;
            }

            .infi-acc-tags {
                display: flex;
                flex-wrap: wrap;
                gap: 6px;
                margin: 12px 0 8px 0;
            }

            .infi-tag {
                font-size: 11.5px;
                font-weight: 700;
                background: #f0f9ff;
                color: #0369a1;
                border: 1px solid #bae6fd;
                padding: 2px 10px;
                border-radius: 9999px;
            }

            .infi-acc-action-btn {
                display: inline-flex;
                align-items: center;
                gap: 6px;
                font-size: 12.5px;
                font-weight: 800;
                color: #ffffff;
                background: #0284c7;
                padding: 6px 14px;
                border-radius: 8px;
                text-decoration: none;
                margin-top: 6px;
                transition: background 0.15s ease, transform 0.15s ease;
            }
            .infi-acc-action-btn:hover {
                background: #0369a1;
                transform: translateX(-2px);
            }

            /* חלק תחתון (Footer) */
            .infi-footer {
                padding: 14px 26px;
                border-top: 1px solid #e2e8f0;
                background: #f8fafc;
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 12px;
                flex-wrap: wrap;
                flex-shrink: 0;
            }

            .infi-footer-notice {
                font-size: 12.5px;
                color: #475569;
                font-weight: 600;
                line-height: 1.45;
                flex: 1;
                min-width: 220px;
            }

            .infi-btn-row {
                display: flex;
                gap: 8px;
                align-items: center;
            }

            .infi-btn-primary {
                background: #0284c7;
                color: #ffffff;
                border: none;
                padding: 8px 18px;
                border-radius: 10px;
                font-size: 13.5px;
                font-weight: 800;
                cursor: pointer;
                display: inline-flex;
                align-items: center;
                gap: 6px;
                transition: background 0.15s ease, transform 0.15s ease;
            }
            .infi-btn-primary:hover {
                background: #0369a1;
                transform: translateY(-1px);
            }

            .infi-btn-secondary {
                background: #ffffff;
                border: 1.5px solid #cbd5e1;
                color: #334155;
                padding: 8px 14px;
                border-radius: 10px;
                font-size: 13px;
                font-weight: 700;
                cursor: pointer;
                display: inline-flex;
                align-items: center;
                gap: 6px;
                transition: all 0.15s ease;
            }
            .infi-btn-secondary:hover {
                background: #f1f5f9;
                border-color: #94a3b8;
            }

            .infi-btn-success {
                background: #10b981 !important;
                border-color: #10b981 !important;
                color: #ffffff !important;
            }

            /* כרטיס שיתוף מיוחד */
            .infi-share-hub-card {
                display: flex;
                align-items: center;
                gap: 14px;
                padding: 14px 16px;
                background: #f0f9ff;
                border: 1.5px solid #bae6fd;
                border-radius: 14px;
                text-decoration: none;
                margin-top: 14px;
                transition: transform 0.2s ease, box-shadow 0.2s ease;
            }
            .infi-share-hub-card:hover {
                transform: translateY(-2px);
                box-shadow: 0 6px 18px rgba(2, 132, 199, 0.22);
            }

            /* הודעת טוסט (Toast) */
            .infi-toast {
                position: fixed;
                top: 24px;
                left: 50%;
                transform: translateX(-50%);
                background: #0f172a;
                color: #ffffff;
                padding: 12px 24px;
                border-radius: 9999px;
                font-size: 14px;
                font-weight: 600;
                display: flex;
                align-items: center;
                gap: 8px;
                box-shadow: 0 10px 30px rgba(0, 0, 0, 0.35);
                border: 1px solid #0284c7;
                z-index: 100000;
                animation: infiToastSlide 0.3s cubic-bezier(0.16, 1, 0.3, 1);
            }

            /* רספונסיביות למובייל */
            @media (max-width: 640px) {
                .infi-header {
                    padding: 20px 20px 14px 20px;
                }
                .infi-title {
                    font-size: 18px;
                }
                .infi-body {
                    padding: 16px 18px;
                }
                .infi-footer {
                    padding: 14px 18px 18px 18px;
                }
                .infi-btn-row {
                    flex-direction: column;
                    width: 100%;
                }
                .infi-btn-primary, .infi-btn-secondary {
                    width: 100%;
                }
            }
        `;
        document.head.appendChild(styleEl);
    }

    /* ==========================================================================
       2. פונקציית עזר להצגת Toast עדין
       ========================================================================== */
    function showToast(message, emoji = '🎉') {
        const existing = document.querySelector('.infi-toast');
        if (existing) existing.remove();

        const toast = document.createElement('div');
        toast.className = 'infi-toast';
        toast.innerHTML = `<span>${emoji}</span> <span>${message}</span>`;
        document.body.appendChild(toast);

        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transition = 'opacity 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        }, 3200);
    }

    /* ==========================================================================
       3. לוגיקת העתקת קישור ללוח
       ========================================================================== */
    function copyCourseLink(btnElement) {
        // קישור ישיר לדף הראשי של האתר - נטו קישור בלבד ללא טקסט נלווה
        const baseUrl = 'https://infi-1.pages.dev/';

        const handleSuccess = () => {
            showToast('הקישור הועתק ללוח: ' + baseUrl, '📋');
            if (btnElement) {
                const origHtml = btnElement.innerHTML;
                btnElement.classList.add('infi-btn-success');
                btnElement.innerHTML = `<span>✓</span> <span>הקישור הועתק!</span>`;
                setTimeout(() => {
                    btnElement.classList.remove('infi-btn-success');
                    btnElement.innerHTML = origHtml;
                }, 2500);
            }
        };

        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(baseUrl).then(handleSuccess).catch(() => {
                fallbackCopy(baseUrl, handleSuccess);
            });
        } else {
            fallbackCopy(baseUrl, handleSuccess);
        }
    }

    function fallbackCopy(text, callback) {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.top = '-9999px';
        textArea.style.left = '-9999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        try {
            document.execCommand('copy');
            if (callback) callback();
        } catch (e) {
            alert('העתק את הקישור מטה:\n\n' + text);
        }
        document.body.removeChild(textArea);
    }

    /* ==========================================================================
       4. יצירת חלון כניסה ראשונה (Welcome & Roadmap Modal)
       ========================================================================== */
    function createWelcomeModal() {
        injectStyles();

        // הסרת מודאל קיים אם פתוח
        const existing = document.getElementById('infi-welcome-backdrop');
        if (existing) existing.remove();

        const backdrop = document.createElement('div');
        backdrop.id = 'infi-welcome-backdrop';
        backdrop.className = 'infi-backdrop';

        backdrop.innerHTML = `
            <div class="infi-modal-card welcome-size" role="dialog" aria-modal="true" aria-labelledby="infi-welcome-title">
                <button type="button" class="infi-close-btn" id="infi-welcome-close-x" aria-label="סגור חלון">✕</button>

                <div class="infi-header">
                    <div class="infi-badge">
                        <span>🧭</span>
                        <span>מדריך התמצאות ולמידה בקורס</span>
                    </div>
                    <h2 class="infi-title" id="infi-welcome-title">חשבון אינפיניטסימלי 1 (20474)</h2>
                    <p class="infi-subtitle">הסבר על מבנה האתר, מצבי הלימוד ביחידות, תרגול השאלות ומאגרי הבחינות</p>
                </div>

                <div class="infi-body">
                    <div class="infi-guide-card">
                        <div class="infi-guide-title">
                            <span>💡</span>
                            <span>איך ללמוד ולהצליח בקורס</span>
                        </div>
                        <p class="infi-guide-text">
                            כל הסעיפים מטה מוצגים כתיבות מכתב סגורות ומסודרות. לחצו על כל סעיף כדי לפתוח אותו ולקבל פירוט מלא על אופן הפעולה, הכלים והיתרונות המובנים בו:
                        </p>
                    </div>

                    <div class="infi-acc-container">
                        <!-- פריט 1: פרקי הלימוד (סגור בהתחלה) -->
                        <div class="infi-acc-item" id="infi-acc-1">
                            <button type="button" class="infi-acc-header" onclick="window.__infiToggleAcc(1)">
                                <div class="infi-acc-header-left">
                                    <div class="infi-acc-icon">📚</div>
                                    <div class="infi-acc-header-text">
                                        <div class="infi-acc-name">1. פרקי הלימוד ואופן הלמידה המובנה</div>
                                        <div class="infi-acc-snippet">כיסוי מלא של סילבוס הקורס, מצבי תצוגה מותאמים ושאלות הכוונה עצמית</div>
                                    </div>
                                </div>
                                <div class="infi-acc-chevron">▼</div>
                            </button>
                            <div class="infi-acc-content">
                                <div class="infi-acc-desc">
                                    כיסוי מתודי של 8 יחידות הלימוד (המספרים הממשיים, סדרות וגבולות, רציפות, נגזרות, משפטי גזירות, חקירת פונקציות, אינטגרל רימן וטורים אינסופיים). בכל פרק מוטמעים עזרי תרגול ושאלות הכוונה עצמית ❓.
                                    
                                <div style="background: #f0f9ff; border: 1.5px solid #bae6fd; border-radius: 12px; padding: 12px 14px; margin: 10px 0;">
                                    <strong style="color: #0369a1; font-size: 14px; display: block; margin-bottom: 6px;">🎚️ 3 מצבי התצוגה המובנים בראש כל פרק:</strong>
                                    <p style="margin: 0 0 8px 0; font-size: 13px; line-height: 1.55; color: #334155;">
                                        בראש כל פרק יש כפתור מעבר בין שלושה מצבי תצוגה שמותאמים לשלבי הלימוד השונים:
                                    </p>
                                    <ul style="margin: 0; padding-right: 18px; line-height: 1.7; font-size: 13px; color: #1e293b;">
                                        <li><strong>🏛️ מצב פורמלי:</strong> הגדרות מתמטיות ריגורוזיות, תנאי סף, ניסוחי משפטים מדויקים והוכחות מלאות שלב-אחר-שלב. <em>מתי להשתמש:</em> כשרוצים לדעת בדיוק איך לנסח תשובה תקנית ומלאה במבחן, עם כל התנאים והנימוקים שהבודקים דורשים.</li>
                                        <li><strong>📖 בגובה העיניים:</strong> פירוק הרעיונות המופשטים להסברים נגישים וברורים בגובה העיניים, בליווי אנלוגיות ותרשימים שמסבירים "מה זה בעצם אומר בתכל'ס". <em>איך לעבוד איתו:</em> במפגש ראשון עם הגדרה או משפט חדש כדי לבנות אינטואיציה פנימית מוצקה לפני הצלילה לנוסחאות.</li>
                                        <li><strong>⚡ משפטים נטו:</strong> תמצית חדה וממוקדת של כל המשפטים, הטענות, תנאי הבדיקה והנוסחאות בלבד, ללא הוכחות והסברים ארוכים. <em>מתי להשתמש:</em> בחזרות ממוקדות לפני מבחן, שינון מהיר ושליפת תבניות פתרון בזמן תרגול.</li>
                                    </ul>
                                </div>
                                </div>
                                <div class="infi-acc-tags">
                                    <span class="infi-tag">כיסוי מלא של הסילבוס</span>
                                    <span class="infi-tag">מצבי תצוגה מובנים</span>
                                    <span class="infi-tag">שאלות הכוונה עצמית ❓</span>
                                </div>
                                <a href="1.html" class="infi-acc-action-btn">
                                    <span>כניסה לפרק 1: המספרים הממשיים</span>
                                    <span>←</span>
                                </a>
                            </div>
                        </div>

                        <!-- פריט 2: הסימולציות והעזרים הגרפיים (סגור בהתחלה) -->
                        <div class="infi-acc-item" id="infi-acc-2">
                            <button type="button" class="infi-acc-header" onclick="window.__infiToggleAcc(2)">
                                <div class="infi-acc-header-left">
                                    <div class="infi-acc-icon">🌊</div>
                                    <div class="infi-acc-header-text">
                                        <div class="infi-acc-name">2. הסימולציות והעזרים הגרפיים — מה לומדים מהם ואיך לתפעל</div>
                                        <div class="infi-acc-snippet">המחשת מנגנונים דינמיים, חקירת פרמטרים ומקרי קצה בזמן אמת במקום שינון יבש</div>
                                    </div>
                                </div>
                                <div class="infi-acc-chevron">▼</div>
                            </button>
                            <div class="infi-acc-content">
                                <div class="infi-acc-desc">
                                    העזרים הוויזואליים והמעבדות האינטראקטיביות שזורים ישירות בתוך פרקי הלימוד:
                                    <ul style="margin: 6px 0; padding-right: 20px; line-height: 1.65; font-size: 13.5px; color: #1e293b;">
                                        <li><strong>🎯 מה הערך הפדגוגי שלהם:</strong> הסימולציות נועדו להמחיש את המנגנונים הדינמיים (התנהגות תהליכים, תנועת נתונים, פעולת אלגוריתמים, שינויים במרחב וגבולות) שקשה לתפוס מטקסט סטטי בלבד.</li>
                                        <li><strong>💡 איך ללמוד מהם נכון:</strong> אל תסתפקו בהתבוננות פסיבית! שנו ערכים בסליידרים, הזינו קלטים שונים, הריצו תהליכים צעד-אחר-צעד, ובדקו מקרי קצה כדי לראות את התגובה בזמן אמת.</li>
                                        <li><strong>🔍 בקורס זה:</strong> העזרים הוויזואליים ממחישים את הגדרות $\varepsilon$-$\delta$, רציפות, התכנסות סדרות ושיפוע המשיק בנגזרת. שחקו עם סליידרים של מרחקי אפסילון וערכי קיצון כדי להבין מתי התנאי מתקיים ומתי הוא מופר.</li>
                                    </ul>
                                </div>
                                <div class="infi-acc-tags">
                                    <span class="infi-tag">המחשה ויזואלית חיה</span>
                                    <span class="infi-tag">שינוי פרמטרים ומקרי קצה</span>
                                    <span class="infi-tag">הבנה אינטואיטיבית עמוקה</span>
                                </div>
                                <a href="1.html" class="infi-acc-action-btn">
                                    <span>למעבדות בפרק הראשון</span>
                                    <span>←</span>
                                </a>
                            </div>
                        </div>

                        <!-- פריט 3: תרגול שאלות ומצבי התשובה (סגור בהתחלה) -->
                        <div class="infi-acc-item" id="infi-acc-3">
                            <button type="button" class="infi-acc-header" onclick="window.__infiToggleAcc(3)">
                                <div class="infi-acc-header-left">
                                    <div class="infi-acc-icon">🎯</div>
                                    <div class="infi-acc-header-text">
                                        <div class="infi-acc-name">3. תרגול שאלות, מצבי הפתרון וניתוח מסיחים</div>
                                        <div class="infi-acc-snippet">שאלות הכוונה ❓ בפרקים, דרגות פתרון מדורגות (רמז, שלד, פתרון מלא) ופירוק מלכודות</div>
                                    </div>
                                </div>
                                <div class="infi-acc-chevron">▼</div>
                            </button>
                            <div class="infi-acc-content">
                                <div class="infi-acc-desc">
                                    המערכת מעודדת תרגול אקטיבי ולא רק קריאה פסיבית:
                                    <ul style="margin: 6px 0; padding-right: 20px; line-height: 1.65; font-size: 13.5px; color: #1e293b;">
                                        <li><strong>❓ שאלות הכוונה (Active Recall):</strong> לצד תת-סעיפים מוטמע כפתור ❓. לפני שאתם קוראים את ההסבר או הפתרון, לחצו עליו ונסו לנסח את התשובה בעצמכם כדי לוודא שאתם מסוגלים לשחזר את החומר לבד.</li>
                                        <li><strong>🎚️ מצבי התשובה והפתרון בשאלות:</strong>
                                            <div style="margin-top: 4px; padding: 6px 12px; background: #f0f9ff; border: 1.5px solid #bae6fd; border-radius: 8px; font-size: 12.5px; line-height: 1.6;">
                                                • <strong>רמז (Hint):</strong> כיוון מחשבה ראשוני להתמודדות עצמאית מבלי לחשוף את התשובה.<br>
                                                • <strong>שלד פתרון (Solution Outline):</strong> ראשי הפרקים ושלבי העבודה המרכזיים של התשובה.<br>
                                                • <strong>פתרון מלא ומנומק (Full Solution):</strong> פתרון פורמלי ומלא שלב-אחר-שלב ברמת בחינה.
                                            </div>
                                        </li>
                                        <li><strong>🧠 ניתוח מסיחים מעמיק:</strong> בשאלות רב-ברירה, המערכת מפרקת עבורכם כל אחד מהמסיחים השגויים: למה הוא נראה מפתה, איזו טעות חישוב או הנחה מוטעית הובילה אליו, ואיך להיזהר מהמלכודת של כותבי הבחינה.</li>
                                        <li><strong>🎯 מאגר שאלות אמריקאיות ייעודי:</strong> זמין בדף <a href="american.html" style="color: #0284c7; font-weight: bold; text-decoration: underline;">מאגר שאלות אמריקאיות וניתוח מסיחים</a> — מעל 100 שאלות מבחן עם ניתוח מעמיק לכל מסיח שגוי, שעון עצר בחינה ומעקב ביצועים.</li>
                                    </ul>
                                </div>
                                <div class="infi-acc-tags">
                                    <span class="infi-tag">שאלות הכוונה ❓</span>
                                    <span class="infi-tag">רמז / שלד / פתרון מלא</span>
                                    <span class="infi-tag">ניתוח מעמיק לכל מסיח</span>
                                </div>
                                <a href="1.html" class="infi-acc-action-btn">
                                    <span>לתרגול בפרקים</span>
                                    <span>←</span>
                                </a>
                            </div>
                        </div>

                        <!-- פריט 4: מאגר הבחינות והדרייב (סגור בהתחלה) -->
                        <div class="infi-acc-item" id="infi-acc-4">
                            <button type="button" class="infi-acc-header" onclick="window.__infiToggleAcc(4)">
                                <div class="infi-acc-header-left">
                                    <div class="infi-acc-icon">📑</div>
                                    <div class="infi-acc-header-text">
                                        <div class="infi-acc-name">4. מאגר הבחינות, קובצי המקור ב-Google Drive ומחברות (91–100)</div>
                                        <div class="infi-acc-snippet">84 בחינות משוחזרות, קישורים לטפסי מקור בדרייב, פתרונות רשמיים והשוואה למחברות שקיבלו 100</div>
                                    </div>
                                </div>
                                <div class="infi-acc-chevron">▼</div>
                            </button>
                            <div class="infi-acc-content">
                                <div class="infi-acc-desc">
                                    הכנה מעשית ממוקדת לבחינת הגמר של האוניברסיטה הפתוחה:
                                    <ul style="margin: 6px 0; padding-right: 20px; line-height: 1.65; font-size: 13.5px; color: #1e293b;">
                                        <li><strong>📁 מה כולל מאגר ה-Google Drive:</strong>
                                            <div style="margin-top: 4px; padding: 6px 12px; background: #f0f9ff; border: 1.5px solid #bae6fd; border-radius: 8px; font-size: 12.5px; line-height: 1.6;">
                                                • <strong>טפסי בחינה סרוקים מקוריים</strong> של האוניברסיטה הפתוחה ממועדי א', ב' ומיוחדים.<br>
                                                • <strong>פתרונות רשמיים</strong> מלאים ומפורטים.<br>
                                                • <strong>מחברות בחינה אמיתיות של סטודנטים שקיבלו ציונים 91–100:</strong> מאפשר להשוות את דרך הכתיבה, הפירוט והנימוק שלכם לכתיבה שקיבלה ניקוד מלא במבחן.
                                            </div>
                                        </li>
                                        <li><strong>🎯 מצב מיקוד לבחינה:</strong> בדפי המבחנים ניתן להפעיל מצב מיקוד (קיפול תפריטים והסחות דעת) ולתרגל עם שעון עצר כדי להתרגל לזמני הבחינה האמיתיים.</li>
                                    </ul>
                                </div>
                                <div class="infi-acc-tags">
                                    <span class="infi-tag">84 בחינות</span>
                                    <span class="infi-tag">קובצי מקור ב-Google Drive</span>
                                    <span class="infi-tag">מחברות מצטיינים (91–100)</span>
                                    <span class="infi-tag">מצב מיקוד וטיימר</span>
                                </div>
                                <a href="exams.html" class="infi-acc-action-btn">
                                    <span>מאגר הבחינות והדרייב</span>
                                    <span>←</span>
                                </a>
                            </div>
                        </div>

                        <!-- פריט 5: חומרי הסיכום והעזרים המשלימים (סגור בהתחלה) -->
                        <div class="infi-acc-item" id="infi-acc-5">
                            <button type="button" class="infi-acc-header" onclick="window.__infiToggleAcc(5)">
                                <div class="infi-acc-header-left">
                                    <div class="infi-acc-icon">📝</div>
                                    <div class="infi-acc-header-text">
                                        <div class="infi-acc-name">5. חומרי הסיכום והעזרים המשלימים</div>
                                        <div class="infi-acc-snippet">מחברת סיכום מקיפה עם מרקרים פסטליים וטבלאות השוואה לחזרה מהירה לפני המבחן</div>
                                    </div>
                                </div>
                                <div class="infi-acc-chevron">▼</div>
                            </button>
                            <div class="infi-acc-content">
                                <div class="infi-acc-desc">
                                    כלי עיון וחזרה מרוכזת לשלבי הסיום של הלמידה:
                                    <ul style="margin: 6px 0; padding-right: 20px; line-height: 1.65; font-size: 13.5px; color: #1e293b;">
                                        <li><strong>📝 סיכום הקורס המקיף:</strong> זמין בדף <a href="summary.html" style="color: #0284c7; font-weight: bold; text-decoration: underline;">סיכום הקורס המקיף (מחברת דיגיטלית עם מרקרים)</a> — מחברת סיכום דיגיטלית מסודרת עם הדגשות צבעוניות וטבלאות השוואה מהירות.</li>
                                    <li><strong>⚖️ מאגר 42 משפטי ההוכחה למבחן:</strong> זמין בדף <a href="profs.html" style="color: #0284c7; font-weight: bold; text-decoration: underline;">profs.html</a> — שליטה מלאה בכל הוכחות החובה למבחן, ניתוח שכיחויות 2015–2026, שלד הוכחה מהיר לשינון וסרטוני הסבר.</li>
                                    <li><strong>🎮 משחק אימון אינטואיציה מהירה:</strong> זמין בדף <a href="game.html" style="color: #0284c7; font-weight: bold; text-decoration: underline;">game.html</a> — אתגר מהיר נגד השעון לבדיקת אינסטינקטים ושליפה מיידית תחת לחץ זמנים.</li>
                                    </ul>
                                </div>
                                <div class="infi-acc-tags">
                                    <span class="infi-tag">סיכום מקיף ומסודר</span>
                                    <span class="infi-tag">מרקרים פסטליים</span>
                                    <span class="infi-tag">טבלאות השוואה מהירות</span>
                                </div>
                                <a href="summary.html" class="infi-acc-action-btn">
                                    <span>לסיכום הקורס המקיף</span>
                                    <span>←</span>
                                </a>
                            </div>
                        </div>
                    </div>

                    <!-- פוטר עם העתקת קישור בלבד -->
                    <div class="infi-footer">
                        <div class="infi-footer-notice">
                            💬 מכירים חברים שלומדים את הקורס? נשמח שתשתפו אותם בקישור הישיר לאתר.
                        </div>
                        <div class="infi-btn-row">
                            <button type="button" class="infi-btn-secondary" id="infi-welcome-copy-btn">
                                📋 העתקת קישור לאתר
                            </button>
                            <button type="button" class="infi-btn-primary" id="infi-welcome-start-btn">
                                🚀 הבנתי, בואו נתחיל
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(backdrop);

        const closeModal = () => {
            backdrop.style.opacity = '0';
            backdrop.style.transition = 'opacity 0.25s ease';
            setTimeout(() => backdrop.remove(), 250);
        };

        // אירועים
        document.getElementById('infi-welcome-close-x').addEventListener('click', closeModal);
        document.getElementById('infi-welcome-start-btn').addEventListener('click', closeModal);
        document.getElementById('infi-welcome-copy-btn').addEventListener('click', function () {
            copyCourseLink(this);
        });

        // סגירה בלחיצה על הרקע החיצוני
        backdrop.addEventListener('click', (e) => {
            if (e.target === backdrop) closeModal();
        });

        // סגירה ב-Escape
        const handleEsc = (e) => {
            if (e.key === 'Escape') {
                closeModal();
                document.removeEventListener('keydown', handleEsc);
            }
        };
        document.addEventListener('keydown', handleEsc);
    }

    // פונקציית פתיחה/סגירה של אקורדיון
    window.__infiToggleAcc = function (index) {
        const item = document.getElementById(`infi-acc-${index}`);
        if (!item) return;
        const isOpen = item.classList.contains('open');

        // סגירת שאר הפריטים לחוויה נקייה וממוקדת
        document.querySelectorAll('.infi-acc-item').forEach(el => {
            if (el !== item) el.classList.remove('open');
        });

        if (isOpen) {
            item.classList.remove('open');
        } else {
            item.classList.add('open');
        }
    };

    /* ==========================================================================
       5. יצירת חלון תזכורת שיתוף ומאגר הקורסים (Recurring 5-Day Share Modal)
       ========================================================================== */
    function createShareModal() {
        injectStyles();

        // מניעת כפילות
        const existing = document.getElementById('infi-share-backdrop');
        if (existing) existing.remove();

        const backdrop = document.createElement('div');
        backdrop.id = 'infi-share-backdrop';
        backdrop.className = 'infi-backdrop';

        backdrop.innerHTML = `
            <div class="infi-modal-card share-size" role="dialog" aria-modal="true" aria-labelledby="infi-share-title">
                <!-- כפתור סגירה X -->
                <button class="infi-close-btn" id="infi-share-close-x" title="סגור חלון" aria-label="סגור חלון">✕</button>

                <!-- כותרת -->
                <div class="infi-header">
                    <div class="infi-badge">
                        <span>💙</span>
                        <span>לומדים יחד • משתפים ומצליחים</span>
                    </div>
                    <h2 class="infi-title" id="infi-share-title">נהנים מהאתר ומחומרי הלימוד? 😊</h2>
                    <p class="infi-subtitle">
                        שמחים שהאתר מלווה אתכם בלמידה לקראת המבחן באינפי 1!
                    </p>
                </div>

                <!-- גוף ההודעה -->
                <div class="infi-body">
                    <div class="infi-share-box">
                        <p class="infi-share-text">
                            מאגר האתרים והקורסים שלנו מתעדכן באופן שוטף לרווחת ציבור הסטודנטים.
                        </p>
                        <p class="infi-share-text" style="margin-bottom: 0;">
                            אם האתר עוזר לכם להבין את החומר, או שאתם פוגשים חברים שמבקשים עזרה, מתלבטים איך ללמוד את הקורס, או צריכים הכוונה לקראת המבחן — <strong>נשמח שתשתפו אותם בקישור הישיר לאתר.</strong>
                        </p>
                    </div>

                    <!-- כרטיס קישור ישיר להעתקה -->
                    <div style="background: #ffffff; border: 1.5px solid #cbd5e1; border-radius: 14px; padding: 12px 14px; margin-bottom: 12px;">
                        <label style="display: block; font-size: 13px; font-weight: 800; color: #0f172a; margin-bottom: 8px;">
                            📋 קישור ישיר לאתר (נטו קישור):
                        </label>
                        <div style="display: flex; gap: 8px; align-items: center;">
                            <input id="infi-share-link-input" type="text" readonly value="https://infi-1.pages.dev/"
                                style="flex: 1; padding: 9px 12px; border: 1.5px solid #94a3b8; border-radius: 8px; font-size: 13px; background: #f8fafc; color: #0f172a; direction: ltr; text-align: left; font-family: monospace; font-weight: 600; outline: none;">
                            <button type="button" class="infi-btn-primary" id="infi-share-copy-btn" style="padding: 9px 16px; font-size: 13px; white-space: nowrap; display: flex; align-items: center; gap: 6px;">
                                <span>📋</span>
                                <span>העתק קישור</span>
                            </button>
                        </div>
                    </div>

                    <!-- כרטיס מעבר למאגר הקורסים הראשי -->
                    <div class="infi-share-hub-card">
                        <div class="hub-icon">🌐</div>
                        <div class="hub-content">
                            <strong>מחפשים עוד קורסים וכלים אקדמיים?</strong>
                            בדקו את מאגר הקורסים הראשי שלנו — ייתכן שיש שם קורסים נוספים, סיכומים וסימולציות שיעזרו לכם בסמסטר הקרוב!
                        </div>
                    </div>
                </div>

                <!-- פוטר עם כפתורים ראשיים -->
                <div class="infi-footer">
                    <div class="infi-btn-row">
                        <a href="${MAIN_COURSES_HUB_URL}" target="_blank" rel="noopener noreferrer" class="infi-btn-secondary" id="infi-share-hub-btn" style="width: 100%; text-align: center; justify-content: center;">
                            <span>🌐 למאגר הקורסים הראשי</span>
                        </a>
                    </div>
                    <button type="button" class="infi-btn-secondary" id="infi-share-dismiss-btn" style="width: 100%; border: none; background: transparent; color: #64748b; font-size: 13px;">
                        סגור חלון
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(backdrop);

        // פונקציית סגירה - עדכון חותמת זמן של 5 ימים
        const closeModal = () => {
            localStorage.setItem(STORAGE_KEYS.SHARE_LAST_SHOWN, Date.now().toString());
            backdrop.style.opacity = '0';
            backdrop.style.transition = 'opacity 0.25s ease';
            setTimeout(() => backdrop.remove(), 250);
        };

        // אירועים
        document.getElementById('infi-share-close-x').addEventListener('click', closeModal);
        document.getElementById('infi-share-dismiss-btn').addEventListener('click', closeModal);
        document.getElementById('infi-share-copy-btn').addEventListener('click', function () {
            copyCourseLink(this);
        });

        // סגירה בלחיצה על הרקע החיצוני
        backdrop.addEventListener('click', (e) => {
            if (e.target === backdrop) closeModal();
        });

        // סגירה ב-Escape
        const handleEsc = (e) => {
            if (e.key === 'Escape') {
                closeModal();
                document.removeEventListener('keydown', handleEsc);
            }
        };
        document.addEventListener('keydown', handleEsc);
    }

    /* ==========================================================================
       6. לוגיקת בדיקת מועדי פתיחה (State Machine ב-Local Storage)
       ========================================================================== */
    function evaluateTriggers() {
        try {
            const now = Date.now();
            let firstVisit = localStorage.getItem(STORAGE_KEYS.FIRST_VISIT);
            let welcomeShown = localStorage.getItem(STORAGE_KEYS.WELCOME_SHOWN);
            let shareLastShown = localStorage.getItem(STORAGE_KEYS.SHARE_LAST_SHOWN);
            let visitCount = parseInt(localStorage.getItem(STORAGE_KEYS.VISIT_COUNT) || '0', 10);

            // ספירת ביקורים
            visitCount++;
            localStorage.setItem(STORAGE_KEYS.VISIT_COUNT, visitCount.toString());

            // האם זהו ביקור ראשון אי-פעם?
            if (!firstVisit) {
                localStorage.setItem(STORAGE_KEYS.FIRST_VISIT, now.toString());
                firstVisit = now;
            } else {
                firstVisit = parseInt(firstVisit, 10);
            }

            // 1. תרחיש כניסה ראשונה: הצגת חלון ההיכרות וההדרכה
            if (!welcomeShown) {
                setTimeout(() => {
                    createWelcomeModal();
                }, 1000); // השהייה של שניה לטעינה חלקה של העמוד
                return;
            }

            // 2. תרחיש משתמש חוזר: בדיקת חלון שיתוף ומאגר הקורסים
            // דרישת סף מפורשת: חלפה לפחות יממה (24 שעות) מהכניסה הראשונה לאתר!
            const timeSinceFirstVisit = now - firstVisit;
            const isEligibleReturningUser = timeSinceFirstVisit >= ONE_DAY_MS;

            if (isEligibleReturningUser) {
                if (!shareLastShown) {
                    // הפעם הראשונה שמציגים את חלון השיתוף למשתמש חוזר (לאחר לפחות יממה מהכניסה הראשונה)
                    setTimeout(() => {
                        createShareModal();
                    }, 1400);
                } else {
                    // בדיקה האם חלפו לפחות 5 ימים מלאים מהפעם הקודמת שהוצג חלון השיתוף
                    const timeSinceLastShare = now - parseInt(shareLastShown, 10);
                    if (timeSinceLastShare >= FIVE_DAYS_MS) {
                        setTimeout(() => {
                            createShareModal();
                        }, 1400);
                    }
                }
            }
        } catch (e) {
            console.error('[InfiModals] Error evaluating triggers:', e);
        }
    }

    /* ==========================================================================
       7. חשיפת ממשק גלובלי לבדיקה ופתיחה ידנית בכל עת
       ========================================================================== */
    window.showInfiWelcomeModal = createWelcomeModal;
    window.showInfiShareModal = createShareModal;
    window.showCourseWelcomeModal = createWelcomeModal;
    window.showCourseShareModal = createShareModal;
    window.copyInfiCourseLink = function (btn) {
        copyCourseLink(btn);
    };
    window.resetInfiModalsState = function () {
        localStorage.removeItem(STORAGE_KEYS.FIRST_VISIT);
        localStorage.removeItem(STORAGE_KEYS.WELCOME_SHOWN);
        localStorage.removeItem(STORAGE_KEYS.SHARE_LAST_SHOWN);
        localStorage.removeItem(STORAGE_KEYS.VISIT_COUNT);
        console.log('[InfiModals] LocalStorage state has been reset. Refreshing triggers...');
        createWelcomeModal();
    };

    // הפעלה כשה-DOM מוכן
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', evaluateTriggers);
    } else {
        evaluateTriggers();
    }

})();
