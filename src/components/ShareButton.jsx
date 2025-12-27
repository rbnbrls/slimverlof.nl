import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function ShareButton() {
    const [isOpen, setIsOpen] = useState(false);
    const [copied, setCopied] = useState(false);

    const currentUrl = window.location.href;

    const handleCopyLink = async () => {
        try {
            await navigator.clipboard.writeText(currentUrl);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    };

    const handleEmbed = () => {
        const embedCode = `<iframe src="${currentUrl}" width="100%" height="600" frameborder="0"></iframe>`;
        navigator.clipboard.writeText(embedCode);
        alert('Embed code gekopieerd naar klembord!');
        setIsOpen(false);
    };

    const handleWhatsApp = () => {
        const text = `Check deze handige vakantieplanner: ${currentUrl}`;
        window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
        setIsOpen(false);
    };

    return (
        <div className="share-container">
            <button
                className="share-btn"
                onClick={() => setIsOpen(!isOpen)}
                title="Deel deze pagina"
            >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="18" cy="5" r="3"></circle>
                    <circle cx="6" cy="12" r="3"></circle>
                    <circle cx="18" cy="19" r="3"></circle>
                    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
                    <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
                </svg>
            </button>

            <AnimatePresence>
                {isOpen && (
                    <>
                        <motion.div
                            className="share-overlay"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsOpen(false)}
                        />
                        <motion.div
                            className="share-menu"
                            initial={{ opacity: 0, scale: 0.95, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 10 }}
                            transition={{ duration: 0.1 }}
                        >
                            <button onClick={handleCopyLink} className="share-menu-item">
                                <span className="share-menu-icon">🔗</span>
                                {copied ? 'Gekopieerd!' : 'Kopieer link'}
                            </button>
                            <button onClick={handleWhatsApp} className="share-menu-item">
                                <span className="share-menu-icon">💬</span>
                                WhatsApp
                            </button>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}
