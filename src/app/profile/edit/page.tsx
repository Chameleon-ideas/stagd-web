'use client';

import React, { useEffect, useState, useCallback, useMemo, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  CheckCircle,
  XCircle,
  Loader,
  ArrowLeft,
  Camera,
  Globe,
  ExternalLink,
  DollarSign,
  Plane,
  ToggleLeft,
  ToggleRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import {
  checkUsernameAvailable,
  updateUserProfile,
  getArtistProfile,
  getArtistProfileBasic,
  updateArtistProfile,
  deleteAccount,
  uploadAvatar,
  getStandardDisciplines,
  submitCustomDisciplines,
} from '@/lib/api';
import styles from './EditProfile.module.css';
import RequestCreativeModal from '@/components/auth/RequestCreativeModal';

const CITIES = ['Karachi', 'Lahore', 'Islamabad'] as const;
const USERNAME_RE = /^[a-z0-9_]{3,30}$/;

const DISCIPLINE_COLORS = [
  { bg: 'var(--color-yellow)', text: 'var(--color-ink)' },
  { bg: 'var(--color-red)', text: '#fff' },
  { bg: 'var(--color-cyan)', text: '#fff' },
  { bg: 'var(--color-lime)', text: 'var(--color-ink)' },
  { bg: 'var(--color-orange)', text: '#fff' },
  { bg: 'var(--color-green)', text: '#fff' },
];

const getDisciplineColors = (items: string[]) => {
  const result = [];
  let prevIndex = -1;
  for (let i = 0; i < items.length; i++) {
    const d = items[i];
    let hash = 0;
    for (let j = 0; j < d.length; j++) {
      hash = d.charCodeAt(j) + ((hash << 5) - hash);
    }
    const random = Math.floor(Math.abs(Math.sin(hash) * 10000));
    let colorIndex = random % DISCIPLINE_COLORS.length;
    if (colorIndex === prevIndex) {
      const shift = (random % (DISCIPLINE_COLORS.length - 1)) + 1;
      colorIndex = (colorIndex + shift) % DISCIPLINE_COLORS.length;
    }
    result.push(DISCIPLINE_COLORS[colorIndex]);
    prevIndex = colorIndex;
  }
  return result;
};

const FALLBACK_DISCIPLINES = [
  'Cinematographer', 'Photographer', 'Filmmaker', 'Illustrator', 'Musician',
  'Graphic Designer', 'Muralist', 'Animator', 'Art Director',
  'Dancer', 'Poet', 'Sound Designer', 'Sculptor', 'Calligrapher',
  'Fashion Designer', 'Textile Designer', 'Theatre', 'Journalist', 'Architect',
  'Painter', 'Ceramicist', 'Street Artist', 'Comedian',
];

const IgIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
    <circle cx="12" cy="12" r="4" />
    <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
  </svg>
);
const BehanceIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
    <path d="M22 7h-7V5h7v2zm1.726 10c-.442 1.297-2.029 3-5.101 3-3.074 0-5.564-1.729-5.564-5.675 0-3.91 2.325-5.92 5.466-5.92 3.082 0 4.964 1.782 5.375 4.426.078.506.109 1.188.095 2.14H15.97c.13 1.202.992 1.807 2.209 1.807.812 0 1.47-.29 1.786-.86h3.761zM15.998 13h5.251c-.023-1.186-.839-1.893-2.55-1.893-1.614 0-2.527.769-2.701 1.893zM6.5 10.995c.944 0 1.91-.316 1.91-1.445C8.41 8.38 7.62 8 6.5 8H3v3h3.5v-.005zM3 13v3.125h3.5c1.046 0 2.11-.367 2.11-1.57C8.61 13.197 7.617 13 6.5 13H3zm3.5-8C9.9 5 11.5 6.3 11.5 8.5c0 1.3-.7 2.2-1.9 2.7 1.5.4 2.4 1.5 2.4 3 0 2.5-1.9 3.8-5 3.8H0V5h6.5z" />
  </svg>
);
const LinkedInIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6zM2 9h4v12H2z" />
    <circle cx="4" cy="4" r="2" />
  </svg>
);
const XIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.742l7.741-8.851L1.254 2.25H8.08l4.253 5.622 5.91-5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

type UsernameState = 'idle' | 'checking' | 'available' | 'taken' | 'invalid';

interface InitialData {
  fullName: string;
  username: string;
  city: string;
  phone: string;
  bio: string;
  detailedBio: string;
  disciplines: string[];
  availability: string;
  availableFrom: string;
  startingRate: number | '';
  ratesOnRequest: boolean;
  travelAvailable: boolean;
  instagram: string;
  website: string;
  behance: string;
  linkedin: string;
  twitter: string;
  invoiceAutoSend: boolean;
  bankAccountTitle: string;
  bankName: string;
  bankAccountNumber: string;
  bankIban: string;
  isPublic: boolean;
  portfolioTheme: 'light' | 'dark';
  role: 'creative' | 'general';
}

function EditProfilePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isOnboarding = searchParams.get('onboarding') === 'true';
  const { user, isLoading: isAuthLoading, patchUser } = useAuth();

  // Basic Profile (profiles table)
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [city, setCity] = useState('');
  const [phone, setPhone] = useState('');

  // Discipline selector
  const [standardDisciplines, setStandardDisciplines] = useState<string[]>(FALLBACK_DISCIPLINES);
  const [disciplineSearch, setDisciplineSearch] = useState('');

  // Artist Profile (artist_profiles table)
  const [bio, setBio] = useState('');
  const [detailedBio, setDetailedBio] = useState('');
  const [disciplines, setDisciplines] = useState<string[]>([]);
  const [availability, setAvailability] = useState<'available' | 'busy' | 'unavailable'>('available');
  const [availableFrom, setAvailableFrom] = useState('');
  const [startingRate, setStartingRate] = useState<number | ''>('');
  const [ratesOnRequest, setRatesOnRequest] = useState(false);
  const [travelAvailable, setTravelAvailable] = useState(false);

  // Commission Preferences
  const [invoiceAutoSend, setInvoiceAutoSend] = useState(true);
  const [bankAccountTitle, setBankAccountTitle] = useState('');
  const [bankName, setBankName] = useState('');
  const [bankAccountNumber, setBankAccountNumber] = useState('');
  const [bankIban, setBankIban] = useState('');

  // Visibility & Role
  const [isPublic, setIsPublic] = useState(true);
  const [portfolioTheme, setPortfolioTheme] = useState<'light' | 'dark'>('dark');
  const [role, setRole] = useState<'creative' | 'general'>('creative');

  // Avatar
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Socials
  const [instagram, setInstagram] = useState('');
  const [website, setWebsite] = useState('');
  const [behance, setBehance] = useState('');
  const [linkedin, setLinkedin] = useState('');
  const [twitter, setTwitter] = useState('');

  // Track initial state for "dirty" check
  const [initialData, setInitialData] = useState<InitialData | null>(null);

  const [usernameState, setUsernameState] = useState<UsernameState>('idle');
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [isFetchingProfile, setIsFetchingProfile] = useState(true);

  // Account security
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [securityMsg, setSecurityMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isUpdatingEmail, setIsUpdatingEmail] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  // Creative upgrade request
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [lastRequestSentAt, setLastRequestSentAt] = useState<string | null>(null);
  const [requestJustSent, setRequestJustSent] = useState(false);

  // Delete account
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteInput, setDeleteInput] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthLoading && !user) {
      router.push('/auth/login');
      return;
    }

    if (user) {
      // Load standard disciplines from DB (non-blocking)
      getStandardDisciplines().then(list => {
        if (list.length > 0) setStandardDisciplines(list);
      }).catch(() => { /* keep fallback */ });

      // Basic fields
      setFullName(user.full_name);
      setUsername(user.username);
      setCity(user.city ?? '');
      setPhone(user.phone ?? '');

      // Load creative_request_sent_at for cooldown display
      supabase
        .from('profiles')
        .select('creative_request_sent_at')
        .eq('id', user.id)
        .single()
        .then(({ data }) => {
          if (data?.creative_request_sent_at) setLastRequestSentAt(data.creative_request_sent_at);
        });

      // Fetch artist-specific details using optimized lightweight query
      getArtistProfileBasic(user.username).then(profile => {
        if (profile) {
          const p = profile.profile;
          const data: InitialData = {
            fullName: user.full_name,
            username: user.username,
            city: user.city ?? '',
            phone: user.phone ?? '',
            bio: p?.bio || '',
            detailedBio: p?.detailed_bio || '',
            disciplines: p?.disciplines || [],
            availability: p?.availability || 'available',
            availableFrom: p?.available_from || '',
            startingRate: p?.starting_rate || '',
            ratesOnRequest: p?.rates_on_request || false,
            travelAvailable: p?.travel_available || false,
            instagram: p?.instagram_handle || '',
            website: p?.website_url || '',
            behance: p?.behance_url || '',
            linkedin: p?.linkedin_url || '',
            twitter: p?.twitter_url || '',
            invoiceAutoSend: p?.invoice_auto_send ?? true,
            bankAccountTitle: p?.bank_account_title || '',
            bankName: p?.bank_name || '',
            bankAccountNumber: p?.bank_account_number || '',
            bankIban: p?.bank_iban || '',
            isPublic: p?.is_public ?? true,
            portfolioTheme: (p as any)?.portfolio_theme ?? 'dark',
            role: (user.role === 'creative' || user.role === 'both') ? 'creative' : 'general',
          };

          setInitialData(data);

          setBio(data.bio);
          setDetailedBio(data.detailedBio);
          setDisciplines(data.disciplines);
          setAvailability(data.availability as any);
          setAvailableFrom(data.availableFrom);
          setStartingRate(data.startingRate);
          setRatesOnRequest(data.ratesOnRequest);
          setTravelAvailable(data.travelAvailable);
          setInstagram(data.instagram);
          setWebsite(data.website);
          setBehance(data.behance);
          setLinkedin(data.linkedin);
          setTwitter(data.twitter);
          setInvoiceAutoSend(data.invoiceAutoSend);
          setBankAccountTitle(data.bankAccountTitle);
          setBankName(data.bankName);
          setBankAccountNumber(data.bankAccountNumber);
          setBankIban(data.bankIban);
          setIsPublic(data.isPublic);
          setPortfolioTheme((data as any).portfolioTheme ?? 'dark');
          setRole(data.role);
        }
      }).catch(err => {
        console.error('Failed to fetch profile basics:', err);
      }).finally(() => {
        setIsFetchingProfile(false);
      });
    }
  }, [user, isAuthLoading, router]);

  // DIRTY CHECK
  const isDirty = useMemo(() => {
    if (!initialData) return false;
    return (
      fullName !== initialData.fullName ||
      username !== initialData.username ||
      city !== initialData.city ||
      phone !== initialData.phone ||
      bio !== initialData.bio ||
      detailedBio !== initialData.detailedBio ||
      JSON.stringify(disciplines) !== JSON.stringify(initialData.disciplines) ||
      availability !== initialData.availability ||
      availableFrom !== initialData.availableFrom ||
      startingRate !== initialData.startingRate ||
      ratesOnRequest !== initialData.ratesOnRequest ||
      travelAvailable !== initialData.travelAvailable ||
      instagram !== initialData.instagram ||
      website !== initialData.website ||
      behance !== initialData.behance ||
      linkedin !== initialData.linkedin ||
      twitter !== initialData.twitter ||
      invoiceAutoSend !== initialData.invoiceAutoSend ||
      bankAccountTitle !== initialData.bankAccountTitle ||
      bankName !== initialData.bankName ||
      bankAccountNumber !== initialData.bankAccountNumber ||
      bankIban !== initialData.bankIban ||
      isPublic !== initialData.isPublic ||
      portfolioTheme !== initialData.portfolioTheme ||
      role !== initialData.role
    );
  }, [
    initialData, fullName, username, city, phone, bio, detailedBio,
    disciplines, availability, availableFrom, startingRate, ratesOnRequest,
    travelAvailable, instagram, website, behance, linkedin, twitter,
    invoiceAutoSend, bankAccountTitle, bankName, bankAccountNumber, bankIban,
    isPublic, portfolioTheme, role,
  ]);

  const checkUsername = useCallback(async (value: string) => {
    if (!user) return;
    if (value === user.username) { setUsernameState('idle'); return; }
    if (!USERNAME_RE.test(value)) { setUsernameState('invalid'); return; }
    setUsernameState('checking');
    const available = await checkUsernameAvailable(value, user.id);
    setUsernameState(available ? 'available' : 'taken');
  }, [user]);

  useEffect(() => {
    if (!username || isFetchingProfile) return;
    const timer = setTimeout(() => checkUsername(username), 500);
    return () => clearTimeout(timer);
  }, [username, checkUsername, isFetchingProfile]);

  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '');
    setUsername(val);
    setUsernameState('idle');
  };

  const toggleDiscipline = (d: string) => {
    if (disciplines.includes(d)) {
      setDisciplines(disciplines.filter(item => item !== d));
    } else {
      setDisciplines([...disciplines, d]);
    }
  };

  const addCustomDiscipline = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed || disciplines.includes(trimmed)) return;
    setDisciplines([...disciplines, trimmed]);
    setDisciplineSearch('');
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 20 * 1024 * 1024) { setSaveError('Image must be under 20MB'); return; }
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const canSave = usernameState !== 'taken' && usernameState !== 'invalid' && usernameState !== 'checking' && fullName.trim().length > 0;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !canSave) return;
    setIsSaving(true);
    setSaveError(null);

    try {
      // 0. Upload avatar if changed
      let avatarUrl: string | undefined;
      if (avatarFile) {
        setIsUploadingAvatar(true);
        const { url, error: uploadErr } = await uploadAvatar(user.id, avatarFile);
        setIsUploadingAvatar(false);
        if (uploadErr) throw new Error(uploadErr);
        avatarUrl = url ?? undefined;
      }

      const newUsername = username.trim();
      const basicUpdates = {
        ...(avatarUrl ? { avatar_url: avatarUrl } : {}),
        full_name: fullName.trim(),
        username: newUsername,
        city: city || null,
        phone: phone.trim() || null,
      };
      const artistUpdates = {
        bio: bio.trim(),
        detailed_bio: detailedBio.trim(),
        disciplines,
        availability,
        available_from: availableFrom || null,
        starting_rate: startingRate === '' ? null : Number(startingRate),
        rates_on_request: ratesOnRequest,
        travel_available: travelAvailable,
        instagram_handle: instagram.trim(),
        website_url: website.trim(),
        behance_url: behance.trim(),
        linkedin_url: linkedin.trim(),
        twitter_url: twitter.trim(),
        invoice_auto_send: invoiceAutoSend,
        bank_account_title: bankAccountTitle.trim() || null,
        bank_name: bankName.trim() || null,
        bank_account_number: bankAccountNumber.trim() || null,
        bank_iban: bankIban.trim() || null,
        is_public: isPublic,
        portfolio_theme: portfolioTheme,
      };

      // 1. Update basic profile
      const { error: basicError } = await updateUserProfile(user.id, basicUpdates);
      if (basicError) throw new Error(basicError);

      // 2. Update artist profile if creative
      if (role === 'creative') {
        const { error: artistError } = await updateArtistProfile(user.id, artistUpdates);
        if (artistError) throw new Error(artistError);

        // Record any non-standard disciplines for admin review (fire-and-forget)
        const customOnes = disciplines.filter(d => !standardDisciplines.includes(d));
        if (customOnes.length > 0) {
          submitCustomDisciplines(customOnes).catch(() => { });
        }
      }

      // Update auth cache synchronously — no extra round trips
      patchUser({
        full_name: fullName.trim(),
        username: newUsername,
        city: city || undefined,
        phone: phone.trim() || undefined,
        ...(avatarUrl ? { avatar_url: avatarUrl } : {}),
      });

      setSaved(true);
      if (role === 'creative') {
        setTimeout(() => router.push(`/profile/${newUsername}`), 600);
      }
    } catch (err: any) {
      setSaveError(err.message || 'Failed to save changes');
    } finally {
      setIsSaving(false);
    }
  };

  const handleEmailChange = async () => {
    if (!newEmail.trim()) return;
    setIsUpdatingEmail(true);
    setSecurityMsg(null);
    const { error } = await supabase.auth.updateUser({ email: newEmail.trim() });
    setIsUpdatingEmail(false);
    if (error) {
      setSecurityMsg({ type: 'error', text: error.message });
    } else {
      setSecurityMsg({ type: 'success', text: `Confirmation sent to ${newEmail}. Click the link to confirm the change.` });
      setNewEmail('');
    }
  };

  const handleDeleteAccount = async () => {
    if (!user || deleteInput !== user.username) return;
    setIsDeleting(true);
    setDeleteError(null);
    const { error } = await deleteAccount();
    if (error) {
      setDeleteError(error);
      setIsDeleting(false);
      return;
    }
    await supabase.auth.signOut();
    router.push('/');
  };

  const handlePasswordChange = async () => {
    if (newPassword !== confirmPassword) {
      setSecurityMsg({ type: 'error', text: 'Passwords do not match.' });
      return;
    }
    if (newPassword.length < 8) {
      setSecurityMsg({ type: 'error', text: 'Password must be at least 8 characters.' });
      return;
    }
    setIsUpdatingPassword(true);
    setSecurityMsg(null);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setIsUpdatingPassword(false);
    if (error) {
      setSecurityMsg({ type: 'error', text: error.message });
    } else {
      setSecurityMsg({ type: 'success', text: 'Password updated successfully.' });
      setNewPassword('');
      setConfirmPassword('');
    }
  };

  if (isAuthLoading || isFetchingProfile) {
    return <div className={styles.loadingContainer}><div className={styles.loading}>INITIALISING_PROFILE...</div></div>;
  }

  const initials = fullName.split(' ').map(n => n[0]).join('').toUpperCase();

  return (
    <div className={styles.container} style={{ '--edit-header-height': user ? '88px' : '60px' } as React.CSSProperties}>
      <div className={styles.inner}>

        {/* ── SIDEBAR ── */}
        <aside className={styles.sidebar} data-lenis-prevent>
          <Link
            href={role === 'creative' ? `/profile/${user?.username}` : '/explore?tab=creatives'}
            className={styles.backLink}
          >
            <ArrowLeft size={14} /> {role === 'creative' ? 'Back to Profile' : 'Back to Explore'}
          </Link>
          <h1 className={styles.title}>Edit<br />Profile</h1>

          {/* ── ACCOUNT TYPE (locked) ── */}
          {role === 'general' && (
            <div className={styles.accountTypeContainer}>
              <p className={styles.accountTypeLabel}>Account Type</p>
              <div className={styles.accountTypeBadge}>
                <span className={`${styles.rolePill} ${styles.rolePillPatron}`}>
                  Patron
                </span>
              </div>
              <p className={styles.accountTypeLocked}>
                You have a Patron account. Request an upgrade to become a Creative.
              </p>

              <div className={styles.requestSection}>
                {requestJustSent ? (
                  <p className={styles.requestSent}>// Request sent. We'll be in touch.</p>
                ) : (() => {
                  const onCooldown = lastRequestSentAt
                    ? Date.now() - new Date(lastRequestSentAt).getTime() < 24 * 60 * 60 * 1000
                    : false;
                  const hoursLeft = lastRequestSentAt
                    ? Math.ceil((24 * 60 * 60 * 1000 - (Date.now() - new Date(lastRequestSentAt).getTime())) / (60 * 60 * 1000))
                    : 0;
                  return (
                    <>
                      <button
                        type="button"
                        className={styles.requestBtn}
                        disabled={onCooldown}
                        onClick={() => setShowRequestModal(true)}
                      >
                        Request Creative Access
                      </button>
                      {onCooldown && (
                        <p className={styles.cooldownNote}>
                          Request sent. Try again in {hoursLeft}h.
                        </p>
                      )}
                    </>
                  );
                })()}
              </div>
            </div>
          )}
        </aside>

        {/* ── MAIN CONTENT ── */}
        <main className={styles.main} data-lenis-prevent>

          {/* ── ONBOARDING CHECKLIST ── */}
          {isOnboarding && role === 'creative' && (
            <div className={styles.onboardingBanner}>
              <div className={styles.onboardingHeader}>
                <p className={styles.onboardingEyebrow}>// Setup Checklist</p>
                <p className={styles.onboardingTitle}>Build your presence on Stag'd</p>
                <p className={styles.onboardingSubtitle}>Fill these out to get discovered. You can always come back later.</p>
              </div>
              <ul className={styles.checklistItems}>
                {[
                  { label: 'Profile photo', done: !!avatarPreview || !!avatarFile },
                  { label: 'Short bio', done: bio.trim().length > 0 },
                  { label: 'At least one discipline', done: disciplines.length > 0 },
                  { label: 'Your city', done: city !== '' },
                  { label: 'Rate or "Rates on request"', done: startingRate !== '' || ratesOnRequest },
                ].map(({ label, done }) => (
                  <li key={label} className={`${styles.checklistItem} ${done ? styles.checklistItemDone : ''}`}>
                    <span className={styles.checklistDot} />
                    {label}
                  </li>
                ))}
              </ul>
              <Link
                href={`/profile/${user?.username}`}
                className={styles.onboardingSkip}
              >
                Skip for now →
              </Link>
            </div>
          )}

          <form onSubmit={handleSave} className={styles.form}>

            {/* ── SECTION 01: IDENTITY ── */}
            <div className={styles.section}>
              <div className={styles.sectionNumber}>01</div>
              <div className={styles.sectionContent}>
                <div className={styles.sectionHeader}>
                  <h2 className={styles.sectionTitle}>Identity</h2>
                </div>
                <div className={styles.grid}>
                  <div className={styles.field}>
                    <label className={styles.label} htmlFor="fullName">Full Name</label>
                    <input
                      id="fullName"
                      className="input"
                      value={fullName}
                      onChange={e => setFullName(e.target.value)}
                      placeholder="Zia Ahmed"
                      required
                    />
                  </div>
                  <div className={styles.field}>
                    <label className={styles.label} htmlFor="username">Username</label>
                    <div className={styles.usernameWrapper}>
                      <span className={styles.atSign}>@</span>
                      <input
                        id="username"
                        className={`input ${styles.usernameInput}`}
                        value={username}
                        onChange={handleUsernameChange}
                        placeholder="zia_ahmed"
                        maxLength={30}
                        required
                      />
                      <span className={styles.usernameStatus}>
                        {usernameState === 'checking' && <Loader size={16} className={styles.spin} />}
                        {usernameState === 'available' && <CheckCircle size={16} style={{ color: 'var(--color-lime)' }} />}
                        {usernameState === 'taken' && <XCircle size={16} style={{ color: 'var(--color-red)' }} />}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* ── SECTION 02: PROFESSIONAL ── */}
            {role === 'creative' && <div className={styles.section}>
              <div className={styles.sectionNumber}>02</div>
              <div className={styles.sectionContent}>
                <div className={styles.sectionHeader}>
                  <h2 className={styles.sectionTitle}>Professional Specs</h2>
                </div>

                <div className={styles.field}>
                  <label className={styles.label}>Disciplines</label>
                  <div className={styles.disciplineSelect}>
                    {(() => {
                      const query = disciplineSearch.trim().toLowerCase();
                      const filtered = query
                        ? standardDisciplines.filter(d => d.toLowerCase().includes(query))
                        : standardDisciplines;
                      return (
                        <>
                          {(() => {
                            const filteredColors = getDisciplineColors(filtered);
                            return filtered.map((d, i) => {
                              const active = disciplines.includes(d);
                              const colors = filteredColors[i];
                              return (
                                <button
                                  key={d}
                                  type="button"
                                  onClick={() => toggleDiscipline(d)}
                                  className={`${styles.disciplineChip} ${active ? styles.disciplineChipActive : ''}`}
                                  style={{
                                    backgroundColor: active ? colors.bg : 'var(--bg)',
                                    color: active ? colors.text : 'var(--text)',
                                  }}
                                >
                                  {d}
                                </button>
                              );
                            });
                          })()}
                          {(() => {
                            const customDisciplines = disciplines.filter(d => !standardDisciplines.includes(d));
                            const customColors = getDisciplineColors(customDisciplines);
                            return customDisciplines.map((d, i) => {
                              const colors = customColors[i];
                              return (
                                <button
                                  key={d}
                                  type="button"
                                  onClick={() => toggleDiscipline(d)}
                                  className={`${styles.disciplineChip} ${styles.disciplineChipActive}`}
                                  style={{ backgroundColor: colors.bg, color: colors.text }}
                                >
                                  {d}
                                </button>
                              );
                            });
                          })()}
                        </>
                      );
                    })()}
                    <div className={styles.disciplineSearchRow}>
                      <input
                        className={styles.disciplineSearchInput}
                        value={disciplineSearch}
                        onChange={e => setDisciplineSearch(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            const q = disciplineSearch.trim();
                            if (!q) return;
                            const match = standardDisciplines.find(
                              d => d.toLowerCase() === q.toLowerCase()
                            );
                            if (match) { toggleDiscipline(match); setDisciplineSearch(''); }
                            else { addCustomDiscipline(q); }
                          }
                        }}
                        placeholder="Search or add your own..."
                      />
                      {disciplineSearch.trim() &&
                        !standardDisciplines.some(d => d.toLowerCase() === disciplineSearch.trim().toLowerCase()) &&
                        !disciplines.some(d => d.toLowerCase() === disciplineSearch.trim().toLowerCase()) && (
                          <button
                            type="button"
                            className={styles.disciplineAddBtn}
                            onClick={() => addCustomDiscipline(disciplineSearch.trim())}
                          >
                            Add &ldquo;{disciplineSearch.trim()}&rdquo;
                          </button>
                        )}
                    </div>
                  </div>
                </div>

                <div className={styles.field}>
                  <label className={styles.label} htmlFor="bio">Short Catchphrase</label>
                  <input
                    id="bio"
                    className="input"
                    value={bio}
                    onChange={e => setBio(e.target.value)}
                    placeholder="E.g. Capturing the soul of Karachi's streets."
                  />
                </div>

                <div className={styles.field}>
                  <label className={styles.label} htmlFor="detailedBio">Full Biography</label>
                  <textarea
                    id="detailedBio"
                    className={`input ${styles.textarea}`}
                    value={detailedBio}
                    onChange={e => setDetailedBio(e.target.value)}
                    placeholder="Your story, technical background, and creative vision..."
                  />
                </div>

                <div className={styles.grid}>
                  <div className={styles.field}>
                    <label className={styles.label} htmlFor="availability">Current Availability</label>
                    <select id="availability" className="input" value={availability} onChange={e => setAvailability(e.target.value as any)}>
                      <option value="available">Available for Projects</option>
                      <option value="busy">Busy / Engaged</option>
                      <option value="unavailable">Not Active</option>
                    </select>
                  </div>
                  <div className={styles.field}>
                    <label className={styles.label} htmlFor="availableFrom">Available From (Optional)</label>
                    <input
                      id="availableFrom"
                      type="date"
                      className="input"
                      value={availableFrom}
                      onChange={e => setAvailableFrom(e.target.value)}
                    />
                  </div>
                  <div className={styles.fieldFull}>
                    <div className={styles.toggleRow} onClick={() => setIsPublic(!isPublic)}>
                      <div className={styles.toggleLabel}>
                        <span className={styles.toggleTitle}>Public Visibility</span>
                        <span className={styles.toggleDesc}>Show my profile on the Explore page</span>
                      </div>
                      {isPublic ? <ToggleRight size={28} color="var(--color-yellow)" /> : <ToggleLeft size={28} color="var(--text-faint)" />}
                    </div>
                  </div>
                  <div className={styles.fieldFull}>
                    <div className={styles.toggleRow} onClick={() => setPortfolioTheme(t => t === 'dark' ? 'light' : 'dark')}>
                      <div className={styles.toggleLabel}>
                        <span className={styles.toggleTitle}>Portfolio Theme</span>
                        <span className={styles.toggleDesc}>
                          {portfolioTheme === 'light' ? 'Light background — bright, editorial feel' : 'Dark background — cinematic, high-contrast'}
                        </span>
                      </div>
                      {portfolioTheme === 'light' ? <ToggleRight size={28} color="var(--color-yellow)" /> : <ToggleLeft size={28} color="var(--text-faint)" />}
                    </div>
                  </div>
                </div>
              </div>
            </div>}

            {/* ── SECTION 03: LOGISTICS ── */}
            {role === 'creative' && <div className={styles.section}>
              <div className={styles.sectionNumber}>03</div>
              <div className={styles.sectionContent}>
                <div className={styles.sectionHeader}>
                  <h2 className={styles.sectionTitle}>Rates & Logistics</h2>
                </div>
                <div className={styles.grid}>
                  <div className={styles.field}>
                    <label className={styles.label} htmlFor="startingRate">Starting Rate (PKR)</label>
                    <div className={styles.rateInputWrapper}>
                      <span className={styles.currency}>Rs.</span>
                      <input
                        id="startingRate"
                        type="number"
                        className={`input ${styles.rateInput}`}
                        value={startingRate}
                        onChange={e => setStartingRate(e.target.value === '' ? '' : Number(e.target.value))}
                        placeholder="5000"
                        disabled={ratesOnRequest}
                      />
                    </div>
                  </div>
                  <div className={styles.field}>
                    <label className={styles.label}>Rate Policy</label>
                    <div className={styles.toggleRow} onClick={() => setRatesOnRequest(!ratesOnRequest)}>
                      <div className={styles.toggleLabel}>
                        <span className={styles.toggleTitle}>Rates on request</span>
                        <span className={styles.toggleDesc}>Price hidden from profile</span>
                      </div>
                      {ratesOnRequest ? <ToggleRight size={28} color="var(--color-yellow)" /> : <ToggleLeft size={28} color="var(--text-faint)" />}
                    </div>
                  </div>
                  <div className={styles.fieldFull}>
                    <div className={styles.toggleRow} onClick={() => setTravelAvailable(!travelAvailable)}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <Plane size={20} color="var(--color-yellow)" />
                        <div className={styles.toggleLabel}>
                          <span className={styles.toggleTitle}>National Travel Available</span>
                          <span className={styles.toggleDesc}>I can travel outside my base city for work</span>
                        </div>
                      </div>
                      {travelAvailable ? <ToggleRight size={28} color="var(--color-yellow)" /> : <ToggleLeft size={28} color="var(--text-faint)" />}
                    </div>
                  </div>
                </div>
              </div>
            </div>}

            {/* ── SECTION 04: COMMISSION PREFERENCES ── */}
            {role === 'creative' && (
              <div className={styles.section}>
                <div className={styles.sectionNumber}>04</div>
                <div className={styles.sectionContent}>
                  <div className={styles.sectionHeader}>
                    <h2 className={styles.sectionTitle}>Commission Preferences</h2>
                  </div>

                  <div className={styles.fieldFull}>
                    <div className={styles.toggleRow} onClick={() => setInvoiceAutoSend(!invoiceAutoSend)}>
                      <div className={styles.toggleLabel}>
                        <span className={styles.toggleTitle}>Auto-send invoice on proposal acceptance</span>
                        <span className={styles.toggleDesc}>Invoice is sent automatically when client accepts your proposal</span>
                      </div>
                      {invoiceAutoSend ? <ToggleRight size={28} color="var(--color-yellow)" /> : <ToggleLeft size={28} color="var(--text-faint)" />}
                    </div>
                  </div>

                  <div style={{ marginTop: 'var(--space-8)' }}>
                    <label className={styles.label}>Bank Details (for invoices)</label>
                  </div>
                  <div className={styles.grid}>
                    <div className={styles.field}>
                      <label className={styles.label} htmlFor="bankAccountTitle">Account Title</label>
                      <input
                        id="bankAccountTitle"
                        className="input"
                        value={bankAccountTitle}
                        onChange={e => setBankAccountTitle(e.target.value)}
                        placeholder="e.g. Hamza Qureshi"
                      />
                    </div>
                    <div className={styles.field}>
                      <label className={styles.label} htmlFor="bankName">Bank Name</label>
                      <input
                        id="bankName"
                        className="input"
                        value={bankName}
                        onChange={e => setBankName(e.target.value)}
                        placeholder="e.g. HBL, Meezan Bank"
                      />
                    </div>
                    <div className={styles.field}>
                      <label className={styles.label} htmlFor="bankAccountNumber">Account Number</label>
                      <input
                        id="bankAccountNumber"
                        className="input"
                        value={bankAccountNumber}
                        onChange={e => setBankAccountNumber(e.target.value)}
                        placeholder="Account number"
                      />
                    </div>
                    <div className={styles.field}>
                      <label className={styles.label} htmlFor="bankIban">IBAN (Optional)</label>
                      <input
                        id="bankIban"
                        className="input"
                        value={bankIban}
                        onChange={e => setBankIban(e.target.value)}
                        placeholder="PK00XXXX0000000000000000"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ── SECTION 05: DIGITAL INDEX ── */}
            {role === 'creative' && <div className={styles.section}>
              <div className={styles.sectionNumber}>05</div>
              <div className={styles.sectionContent}>
                <div className={styles.sectionHeader}>
                  <h2 className={styles.sectionTitle}>Digital Index</h2>
                </div>
                <div className={styles.grid}>
                  <div className={styles.field}>
                    <label className={styles.label}>Instagram</label>
                    <div className={styles.usernameWrapper}>
                      <span className={styles.atSign}><IgIcon /></span>
                      <input
                        className={`input ${styles.usernameInput}`}
                        value={instagram}
                        onChange={e => setInstagram(e.target.value)}
                        placeholder="handle"
                      />
                    </div>
                  </div>
                  <div className={styles.field}>
                    <label className={styles.label}>Website</label>
                    <div className={styles.usernameWrapper}>
                      <span className={styles.atSign}><Globe size={14} /></span>
                      <input
                        className={`input ${styles.usernameInput}`}
                        value={website}
                        onChange={e => setWebsite(e.target.value)}
                        placeholder="https://yourwork.com"
                      />
                    </div>
                  </div>
                  <div className={styles.field}>
                    <label className={styles.label}>Behance</label>
                    <div className={styles.usernameWrapper}>
                      <span className={styles.atSign}><BehanceIcon /></span>
                      <input
                        className={`input ${styles.usernameInput}`}
                        value={behance}
                        onChange={e => setBehance(e.target.value)}
                        placeholder="https://behance.net/profile"
                      />
                    </div>
                  </div>
                  <div className={styles.field}>
                    <label className={styles.label}>LinkedIn</label>
                    <div className={styles.usernameWrapper}>
                      <span className={styles.atSign}><LinkedInIcon /></span>
                      <input
                        className={`input ${styles.usernameInput}`}
                        value={linkedin}
                        onChange={e => setLinkedin(e.target.value)}
                        placeholder="https://linkedin.com/in/name"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>}

            {/* ── SECTION: ACCOUNT SECURITY ── */}
            <div className={styles.section}>
              <div className={styles.sectionNumber}>{role === 'creative' ? '06' : '02'}</div>
              <div className={styles.sectionContent}>
                <div className={styles.sectionHeader}>
                  <h2 className={styles.sectionTitle}>Account Security</h2>
                </div>

                {securityMsg && (
                  <p className={`${styles.securityMsg} ${securityMsg.type === 'success' ? styles.securityMsgSuccess : styles.securityMsgError}`}>
                    {securityMsg.type === 'success' ? '✓' : '⚠'} {securityMsg.text}
                  </p>
                )}

                <div style={{ marginBottom: '40px' }}>
                  <label className={styles.label}>Change Email</label>
                  <p className={styles.hint} style={{ marginBottom: '12px' }}>
                    Current: <strong style={{ color: 'var(--text)' }}>{user?.email}</strong>
                  </p>
                  <div className={styles.grid}>
                    <div className={styles.field}>
                      <input
                        type="email"
                        className="input"
                        placeholder="New email address"
                        value={newEmail}
                        onChange={e => setNewEmail(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleEmailChange()}
                      />
                    </div>
                    <div className={styles.field}>
                      <button type="button" className={styles.securityBtn} disabled={isUpdatingEmail} onClick={handleEmailChange}>
                        {isUpdatingEmail ? 'Sending...' : 'Send confirmation'}
                      </button>
                    </div>
                  </div>
                </div>

                <div>
                  <label className={styles.label}>Change Password</label>
                  <div className={styles.grid} style={{ marginTop: '12px', marginBottom: '16px' }}>
                    <div className={styles.field}>
                      <input
                        type="password"
                        className="input"
                        placeholder="New password"
                        value={newPassword}
                        onChange={e => setNewPassword(e.target.value)}
                        minLength={8}
                      />
                    </div>
                    <div className={styles.field}>
                      <input
                        type="password"
                        className="input"
                        placeholder="Confirm new password"
                        value={confirmPassword}
                        onChange={e => setConfirmPassword(e.target.value)}
                      />
                    </div>
                  </div>
                  <button type="button" className={styles.securityBtn} disabled={isUpdatingPassword} onClick={handlePasswordChange}>
                    {isUpdatingPassword ? 'Updating...' : 'Update password'}
                  </button>
                </div>
              </div>
            </div>

            {/* ── DANGER ZONE ── */}
            <div className={`${styles.section} ${styles.dangerSection}`}>
              <div className={`${styles.sectionNumber} ${styles.dangerSectionNumber}`}>!</div>
              <div className={styles.sectionContent}>
                <div className={styles.sectionHeader} style={{ border: 'none' }}>
                  <h2 className={`${styles.sectionTitle} ${styles.dangerTitle}`}>Danger Zone</h2>
                </div>

                {!showDeleteConfirm ? (
                  <div>
                    <p className={styles.dangerText}>
                      Permanently delete your account and all associated data — portfolio, projects, commission history, and events. This cannot be undone.
                    </p>
                    <button
                      type="button"
                      className={styles.deleteBtn}
                      onClick={() => setShowDeleteConfirm(true)}
                    >
                      Delete my account
                    </button>
                  </div>
                ) : (
                  <AnimatePresence>
                    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} style={{ padding: '8px 0' }}>
                      <p className={styles.dangerText}>
                        Type your username <strong style={{ color: 'var(--color-red)' }}>@{user?.username}</strong> to confirm deletion.
                      </p>
                      <input
                        className="input"
                        placeholder={user?.username}
                        value={deleteInput}
                        onChange={e => setDeleteInput(e.target.value)}
                        style={{ marginBottom: '16px', borderColor: deleteInput && deleteInput !== user?.username ? 'var(--color-red)' : undefined }}
                        autoFocus
                      />
                      {deleteError && (
                        <p className={styles.error} style={{ textAlign: 'left', marginBottom: '16px' }}>⚠ {deleteError}</p>
                      )}
                      <div style={{ display: 'flex', gap: '16px' }}>
                        <button
                          type="button"
                          className={styles.deleteBtn}
                          onClick={handleDeleteAccount}
                          disabled={deleteInput !== user?.username || isDeleting}
                          style={{
                            backgroundColor: deleteInput === user?.username ? 'var(--color-red)' : 'transparent',
                            color: deleteInput === user?.username ? 'var(--color-white)' : 'var(--color-red)',
                          }}
                        >
                          {isDeleting ? 'Deleting...' : 'Yes, delete everything'}
                        </button>
                        <button
                          type="button"
                          onClick={() => { setShowDeleteConfirm(false); setDeleteInput(''); setDeleteError(null); }}
                          className={styles.securityBtn}
                        >
                          Cancel
                        </button>
                      </div>
                    </motion.div>
                  </AnimatePresence>
                )}
              </div>
            </div>

            {/* ── ACTIONS ── */}
            <AnimatePresence>
              {isDirty && (
                <motion.div
                  initial={{ y: 100, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: 100, opacity: 0 }}
                  className={styles.actionsBar}
                >
                  {saveError && <p className={styles.error}>⚠ {saveError}</p>}
                  <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                    <Link href={`/profile/${user?.username}`} className="btn btn-ghost btn-md">Discard</Link>
                    <button
                      type="submit"
                      className={`btn btn-primary btn-md ${styles.saveBtn}`}
                      disabled={isSaving || !canSave}
                    >
                      {saved ? 'Saved!' : isSaving ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

          </form>
        </main>

        {/* ── RIGHT SIDEBAR (DP UPDATE) ── */}
        <aside className={styles.rightSidebar} data-lenis-prevent>
          <div className={styles.avatarSection}>
            <p className={styles.accountTypeLabel}>Profile Image</p>
            <div className={styles.avatarPreview}>
              {avatarPreview || user?.avatar_url ? (
                <img src={avatarPreview ?? user!.avatar_url} alt={fullName} className={styles.avatarImg} />
              ) : (
                <span className={styles.avatarPlaceholder}>
                  {fullName?.split(' ').map(n => n[0]).join('').toUpperCase() || '?'}
                </span>
              )}
            </div>

            <div style={{ marginTop: '16px', textAlign: 'center' }}>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                style={{ display: 'none' }}
                onChange={handleAvatarChange}
              />
              <button
                type="button"
                className={styles.uploadBtn}
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploadingAvatar}
                style={{ width: '100%', justifyContent: 'center' }}
              >
                <Camera size={14} style={{ marginRight: 8, verticalAlign: 'middle' }} />
                {isUploadingAvatar ? 'Uploading...' : avatarFile ? 'Change Photo' : 'Update Photo'}
              </button>
              <p className={styles.hint} style={{ marginTop: '12px' }}>JPG/PNG/WEBP. MAX 20MB.</p>
              {avatarFile && <p className={styles.hint} style={{ color: 'var(--color-lime)', marginTop: '8px' }}>✓ {avatarFile.name}</p>}
            </div>
          </div>
        </aside>
      </div>

      <AnimatePresence>
        {showRequestModal && (
          <RequestCreativeModal
            onClose={() => setShowRequestModal(false)}
            onSent={() => {
              setShowRequestModal(false);
              setRequestJustSent(true);
              setLastRequestSentAt(new Date().toISOString());
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

export default function EditProfilePageWrapper() {
  return (
    <Suspense>
      <EditProfilePage />
    </Suspense>
  );
}
