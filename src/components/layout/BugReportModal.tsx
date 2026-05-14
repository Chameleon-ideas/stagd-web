"use client";
import { useState } from 'react';
import { X, Send } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import styles from './BugReportModal.module.css';

export function BugReportModal({ onClose }: { onClose: () => void }) {
  const [report, setReport] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!report.trim()) return;
    
    setIsSubmitting(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 800));
    
    setIsSubmitting(false);
    setIsSuccess(true);
    
    // Auto close after success
    setTimeout(() => {
      onClose();
    }, 2000);
  };

  return (
    <motion.div 
      className={styles.overlay}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <motion.div 
        className={styles.modal}
        initial={{ y: 20, opacity: 0, scale: 0.95 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: 20, opacity: 0, scale: 0.95 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
      >
        <button className={styles.closeBtn} onClick={onClose} aria-label="Close">
          <X size={20} />
        </button>

        <div className={styles.header}>
          <span className={styles.label}>// BUG REPORT</span>
          <h2 className={styles.title}>Something broken?</h2>
          <p className={styles.desc}>Let us know what's not working, and we'll fix it in the next build.</p>
        </div>

        <AnimatePresence mode="wait">
          {isSuccess ? (
            <motion.div 
              key="success"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className={styles.successState}
            >
              <div className={styles.successIcon}>
                <Send size={24} />
              </div>
              <h3>Report Sent</h3>
              <p>Thanks for helping us improve Stag'd.</p>
            </motion.div>
          ) : (
            <motion.form 
              key="form"
              onSubmit={handleSubmit}
              initial={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <textarea
                className={styles.textarea}
                placeholder="Describe the issue... (e.g. The checkout button on mobile is overlapping)"
                value={report}
                onChange={(e) => setReport(e.target.value)}
                rows={5}
                required
              />
              <button 
                type="submit" 
                className={`btn btn-accent ${styles.submitBtn}`}
                disabled={isSubmitting || !report.trim()}
              >
                {isSubmitting ? 'Sending...' : 'Send Report'}
              </button>
            </motion.form>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}
