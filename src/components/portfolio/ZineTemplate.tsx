"use client";

import { motion, useScroll, useTransform } from 'framer-motion';
import Image from 'next/image';
import styles from './ZineTemplate.module.css';

interface ZineTemplateProps {
  profile: any;
  events: any;
}

export function ZineTemplate({ profile, events }: ZineTemplateProps) {
  const { scrollYProgress } = useScroll();
  const titleY = useTransform(scrollYProgress, [0, 0.2], [0, -200]);

  const heroPiece = profile.portfolio[0];
  const narrativePiece = profile.portfolio[1];
  const collageWorks = profile.portfolio.slice(2, 8);
  const indexWorks = profile.portfolio;

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 40, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] }
    }
  };

  return (
    <div className={styles.zineContainer}>
      {/* ── THE COVER ── */}
      <section className={styles.cover}>
        <motion.h1
          className={styles.verticalTitle}
          style={{ y: titleY }}
          initial={{ x: -100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 1, delay: 0.2 }}
        >
          {profile.user.full_name}
        </motion.h1>

        <motion.div
          className={styles.coverImageWrapper}
          initial={{ scale: 1.1, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 1.2, ease: "circOut" }}
        >
          <div className={styles.stripeTexture} />
          <Image
            src={heroPiece?.image_url || '/images/default-hero.png'}
            alt={profile.user.full_name}
            fill
            priority
            className={styles.coverImage}
          />
        </motion.div>
      </section>

      {/* ── NARRATIVE 01 ── */}
      <section className={styles.narrativeBlock}>
        <span className={styles.ghostNumber}>01</span>
        <motion.div
          className={styles.narrativeText}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={itemVariants}
        >
          <h2 className={styles.indexTitle} style={{ fontSize: '24px', border: 'none' }}>// The Narrative</h2>
          <p>{profile.profile.bio || "Exploring the boundaries of contemporary visual storytelling through mixed media and digital intervention."}</p>
        </motion.div>

        <motion.div
          className={styles.narrativeMedia}
          initial={{ clipPath: "inset(100% 0 0 0)" }}
          whileInView={{ clipPath: "inset(0% 0 0 0)" }}
          transition={{ duration: 1, ease: "circOut" }}
          viewport={{ once: true }}
        >
          <Image
            src={narrativePiece?.image_url || heroPiece?.image_url}
            alt="Narrative"
            width={800}
            height={1000}
          />
        </motion.div>
      </section>

      {/* ── THE COLLAGE ── */}
      <motion.section
        className={styles.collageGrid}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        variants={containerVariants}
      >
        {collageWorks.map((item: any, i: number) => {
          const sizes = ['small', 'medium', 'large', 'full', 'medium', 'small'];
          const size = sizes[i % sizes.length];

          return (
            <motion.div
              key={item.id}
              className={`${styles.collageItem} ${styles[size]}`}
              variants={itemVariants}
            >
              <span className={styles.metaBadge}>{item.category}</span>
              <Image
                src={item.image_url}
                alt={item.title}
                fill
              />
            </motion.div>
          );
        })}
      </motion.section>

      {/* ── THE INDEX ── */}
      <section className={styles.indexSection}>
        <motion.h2
          className={styles.indexTitle}
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
        >
          Portfolio Index
        </motion.h2>

        <div className={styles.indexTable}>
          {indexWorks.map((item: any, i: number) => (
            <motion.div
              key={item.id}
              className={styles.indexRow}
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ delay: i * 0.05 }}
              viewport={{ once: true }}
            >
              <span>{String(i + 1).padStart(2, '0')}</span>
              <span style={{ flex: 1, marginLeft: '20px' }}>{item.title}</span>
              <span style={{ color: 'var(--text-muted)' }}>{item.category}</span>
              <span style={{ marginLeft: '40px' }}>2024</span>
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  );
}
