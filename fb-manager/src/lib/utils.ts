export const handleCopy = async (text: string, onSuccess?: () => void, onError?: () => void) => {
    if (!text) return;
    try {
        if (navigator.clipboard && window.isSecureContext) {
            await navigator.clipboard.writeText(text);
        } else {
            const el = document.createElement('textarea');
            el.value = text;
            el.style.position = 'absolute';
            el.style.left = '-9999px';
            document.body.appendChild(el);
            el.select();
            document.execCommand('copy');
            document.body.removeChild(el);
        }
        if (onSuccess) onSuccess();
    } catch (err) {
        console.error('Copy failed:', err);
        if (onError) onError();
    }
};

export const getStatusColor = (status: string) => {
    switch (status) {
        case 'Active': return 'bg-emerald-100 text-emerald-800 border-emerald-300';
        case 'Rest': return 'bg-amber-100 text-amber-800 border-amber-300';
        case 'Warning': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
        case 'Error':
        case 'Restricted': return 'bg-rose-100 text-rose-800 border-rose-300';
        default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
};
