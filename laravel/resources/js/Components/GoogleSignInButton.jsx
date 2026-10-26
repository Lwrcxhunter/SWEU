import React, { useEffect, useRef, useState } from 'react';

export default function GoogleSignInButton({ clientId, onSuccess, onError, disabled = false }) {
    const buttonRef = useRef(null);
    const [scriptLoaded, setScriptLoaded] = useState(false);

    useEffect(() => {
        if (!clientId) return;

        if (window.google?.accounts?.id) {
            setScriptLoaded(true);
            return;
        }

        const existingScript = document.getElementById('google-gsi-client');
        if (existingScript) {
            existingScript.addEventListener('load', () => setScriptLoaded(true));
            return;
        }

        const script = document.createElement('script');
        script.id = 'google-gsi-client';
        script.src = 'https://accounts.google.com/gsi/client';
        script.async = true;
        script.defer = true;
        script.onload = () => setScriptLoaded(true);
        script.onerror = () => {
            if (onError) onError('Failed to load Google Sign-In library.');
        };
        document.head.appendChild(script);
    }, [clientId, onError]);

    useEffect(() => {
        if (!scriptLoaded || !clientId || !buttonRef.current || !window.google?.accounts?.id) {
            return;
        }

        try {
            window.google.accounts.id.initialize({
                client_id: clientId,
                callback: (response) => {
                    if (response?.credential) {
                        onSuccess(response.credential);
                    } else if (onError) {
                        onError('No credential returned from Google.');
                    }
                },
                hd: '*', // Allowed domains enforced on server
                auto_select: false,
                cancel_on_tap_outside: true,
            });

            buttonRef.current.replaceChildren();
            window.google.accounts.id.renderButton(buttonRef.current, {
                type: 'standard',
                theme: 'outline',
                size: 'large',
                text: 'continue_with',
                shape: 'rectangular',
                logo_alignment: 'left',
                width: 380,
            });
        } catch (err) {
            console.error('Google button render error:', err);
        }
    }, [scriptLoaded, clientId, onSuccess, onError]);

    if (!clientId) return null;

    return (
        <div className={`w-full flex justify-center my-3 min-h-[44px] ${disabled ? 'opacity-50 pointer-events-none' : ''}`}>
            <div ref={buttonRef} className="w-full flex justify-center" />
        </div>
    );
}
