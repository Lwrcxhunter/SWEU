import React, { useEffect, useRef, useState, useImperativeHandle, forwardRef } from 'react';

const RecaptchaWidget = forwardRef(function RecaptchaWidget(
    { siteKey, onChange, onExpired, onError },
    ref
) {
    const callbacksRef = useRef({ onChange, onExpired, onError });
    callbacksRef.current = { onChange, onExpired, onError };
    const containerRef = useRef(null);
    const widgetIdRef = useRef(null);
    const [scriptReady, setScriptReady] = useState(false);

    useImperativeHandle(ref, () => ({
        reset: () => {
            if (widgetIdRef.current !== null && window.grecaptcha) {
                try {
                    window.grecaptcha.reset(widgetIdRef.current);
                } catch {
                    // ignore
                }
            }
            callbacksRef.current.onChange?.('');
        },
    }));

    useEffect(() => {
        if (!siteKey) return;

        if (window.grecaptcha?.render) {
            setScriptReady(true);
            return;
        }

        const existingScript = document.getElementById('recaptcha-explicit-script');
        if (existingScript) {
            const check = () => {
                if (window.grecaptcha?.render) {
                    setScriptReady(true);
                } else {
                    setTimeout(check, 100);
                }
            };
            check();
            return;
        }

        const script = document.createElement('script');
        script.id = 'recaptcha-explicit-script';
        script.src = 'https://www.google.com/recaptcha/api.js?render=explicit';
        script.async = true;
        script.defer = true;
        script.onload = () => {
            if (window.grecaptcha) {
                window.grecaptcha.ready(() => setScriptReady(true));
            }
        };
        script.onerror = () => {
            callbacksRef.current.onError?.('Unable to load reCAPTCHA challenge. Check connection.');
        };
        document.head.appendChild(script);
    }, [siteKey]);

    useEffect(() => {
        if (!scriptReady || !siteKey || !containerRef.current || !window.grecaptcha?.render) {
            return;
        }

        if (widgetIdRef.current !== null) return;

        try {
            const element = document.createElement('div');
            containerRef.current.replaceChildren(element);
            widgetIdRef.current = window.grecaptcha.render(element, {
                sitekey: siteKey,
                size: 'normal',
                callback: (token) => {
                    callbacksRef.current.onChange?.(token);
                },
                'expired-callback': () => {
                    callbacksRef.current.onExpired?.();
                    callbacksRef.current.onChange?.('');
                },
                'error-callback': () => {
                    callbacksRef.current.onError?.('reCAPTCHA verification error.');
                    callbacksRef.current.onChange?.('');
                },
            });
        } catch (err) {
            console.error('reCAPTCHA render error:', err);
            callbacksRef.current.onError?.('Unable to display reCAPTCHA. Please reload and try again.');
        }

        return () => {
            widgetIdRef.current = null;
            if (containerRef.current) containerRef.current.replaceChildren();
        };
    }, [scriptReady, siteKey]);

    if (!siteKey) return null;

    return (
        <div className="flex flex-col items-center justify-center my-3 w-full">
            <div ref={containerRef} className="min-h-[78px] flex justify-center" />
        </div>
    );
});

export default RecaptchaWidget;
