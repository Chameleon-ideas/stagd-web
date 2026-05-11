'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Upload,
  Plus,
  Trash2,
  Loader,
  X,
  Image as ImageIcon,
  FolderOpen,
  MapPin,
  Check,
  LayoutGrid,
  FilePlus,
  Pencil,
  Save,
  Star,
  GripVertical,
} from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/lib/auth';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import {
  getMyPortfolio,
  uploadPortfolioImage,
  deletePortfolioItem,
  getMyProjects,
  createProject,
  updateProject,
  updateProjectCover,
  addImageToProject,
  deleteProject,
  linkPortfolioItemToProject,
  removeImageFromProject,
  reorderProjects,
} from '@/lib/api';
import type { PortfolioItem, Project } from '@/lib/types';
import styles from './ManageWork.module.css';

const DISCIPLINE_OPTIONS = [
  'Food Photography', 'Product Photography', 'Marketing Content', 'Product Design',
  'Studio', 'Photography', 'Fashion', 'Textile Design', 'Calligraphy',
  'Visual Arts', 'Journalism', 'Street Art',
];

type Section = 'portfolio' | 'projects';

interface ProjectForm {
  title: string;
  description: string;
  discipline: string;
  location: string;
  format: string;
  year: string;
}

const EMPTY_PROJECT_FORM: ProjectForm = { title: '', description: '', discipline: '', location: '', format: '', year: '' };

export default function ManageWorkPage() {
  const router = useRouter();
  const { user, isLoading: isAuthLoading } = useAuth();

  const [section, setSection] = useState<Section>('portfolio');

  // Portfolio state
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([]);
  const [isLoadingPortfolio, setIsLoadingPortfolio] = useState(true);
  const [isUploadingPortfolio, setIsUploadingPortfolio] = useState(false);
  const [portfolioError, setPortfolioError] = useState<string | null>(null);
  const portfolioInputRef = useRef<HTMLInputElement>(null);

  // Projects state
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoadingProjects, setIsLoadingProjects] = useState(true);
  const [showNewProjectForm, setShowNewProjectForm] = useState(false);
  const [newProjectForm, setNewProjectForm] = useState<ProjectForm>(EMPTY_PROJECT_FORM);
  const [isCreatingProject, setIsCreatingProject] = useState(false);
  const [projectError, setProjectError] = useState<string | null>(null);

  // Edit project state
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<ProjectForm>(EMPTY_PROJECT_FORM);
  const [isUpdating, setIsUpdating] = useState(false);

  // Per-project upload state
  const [uploadingProjectId, setUploadingProjectId] = useState<string | null>(null);
  const projectInputRef = useRef<HTMLInputElement>(null);
  const pendingProjectId = useRef<string | null>(null);

  // Portfolio picker modal
  const [pickerProjectId, setPickerProjectId] = useState<string | null>(null);
  const [pickerSelected, setPickerSelected] = useState<Set<string>>(new Set());
  const [isLinking, setIsLinking] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const formAreaRef = useRef<HTMLDivElement>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = projects.findIndex((p) => p.id === active.id);
      const newIndex = projects.findIndex((p) => p.id === over.id);
      const newProjects = arrayMove(projects, oldIndex, newIndex);
      setProjects(newProjects);
      
      const { error } = await reorderProjects(newProjects.map(p => p.id));
      if (error) {
        console.error('Reorder failed:', error);
      }
    }
  };

  // Animations
  useGSAP(() => {
    if (!containerRef.current) return;
    const tl = gsap.timeline({ defaults: { ease: 'expo.out', duration: 0.8 } });
    tl.from(`.${styles.sidebar}`, { x: -40, opacity: 0, duration: 1 })
      .from(`.${styles.stepMeta}`, { y: 10, opacity: 0 }, '-=0.6')
      .from(`.${styles.title}`, { y: 10, opacity: 0 }, '-=0.6')
      .from(`.${styles.navItem}`, { 
        x: -10, 
        opacity: 0, 
        stagger: 0.05,
        clearProps: 'all'
      }, '-=0.4');

    gsap.from(`.${styles.mediaArea}`, { x: 40, opacity: 0, duration: 1 });
  }, { scope: containerRef });

  useGSAP(() => {
    if (formAreaRef.current) {
      gsap.fromTo(formAreaRef.current, 
        { y: 15, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.6, ease: 'expo.out', clearProps: 'y,opacity' }
      );
    }
  }, { dependencies: [section], scope: containerRef });

  // Auth gate
  useEffect(() => {
    if (!isAuthLoading && !user) router.push('/auth/login');
  }, [isAuthLoading, user, router]);

  // Load data
  useEffect(() => {
    if (!user) return;
    getMyPortfolio(user.id).then(items => { setPortfolio(items); setIsLoadingPortfolio(false); });
    getMyProjects(user.id).then(projs => { setProjects(projs); setIsLoadingProjects(false); });
  }, [user]);

  // ── PORTFOLIO UPLOAD ──────────────────────────────────────

  const handlePortfolioFiles = useCallback(async (files: FileList | null) => {
    if (!files || !user) return;
    setIsUploadingPortfolio(true);
    setPortfolioError(null);
    for (const file of Array.from(files).slice(0, 10)) {
      if (file.size > 8 * 1024 * 1024) { setPortfolioError(`${file.name} exceeds 8MB`); continue; }
      const { item, error } = await uploadPortfolioImage(user.id, file);
      if (error) setPortfolioError(error);
      else if (item) setPortfolio(prev => [...prev, item]);
    }
    setIsUploadingPortfolio(false);
  }, [user]);

  const handlePortfolioDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    handlePortfolioFiles(e.dataTransfer.files);
  }, [handlePortfolioFiles]);

  const handleDeletePortfolioItem = async (itemId: string) => {
    if (!confirm('Permanently delete this image from your portfolio?')) return;
    const { error } = await deletePortfolioItem(itemId);
    if (!error) setPortfolio(prev => prev.filter(p => p.id !== itemId));
  };

  // ── PROJECT CREATION ──────────────────────────────────────

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newProjectForm.title.trim()) return;
    setIsCreatingProject(true);
    setProjectError(null);
    const { project, error } = await createProject(user.id, {
      title: newProjectForm.title.trim(),
      description: newProjectForm.description.trim() || undefined,
      discipline: newProjectForm.discipline || undefined,
      location: newProjectForm.location.trim() || undefined,
      format: newProjectForm.format.trim() || undefined,
      year: newProjectForm.year ? parseInt(newProjectForm.year) : undefined,
    });
    setIsCreatingProject(false);
    if (error) { setProjectError(error); return; }
    if (project) {
      setProjects(prev => [project, ...prev]);
      setNewProjectForm(EMPTY_PROJECT_FORM);
      setShowNewProjectForm(false);
      setSection('projects');
      router.refresh();
    }
  };

  // ── PROJECT EDITING ───────────────────────────────────────

  const startEditingProject = (project: Project) => {
    setEditingProjectId(project.id);
    setEditForm({
      title: project.title,
      description: project.description || '',
      discipline: project.discipline || '',
      location: project.location || '',
      format: project.format || '',
      year: project.year?.toString() || '',
    });
  };

  const handleUpdateProject = async () => {
    if (!editingProjectId || !user) return;
    setIsUpdating(true);
    try {
      const { error } = await updateProject(editingProjectId, {
        title: editForm.title.trim(),
        description: editForm.description.trim() || null,
        discipline: editForm.discipline || null,
        location: editForm.location.trim() || null,
        format: editForm.format.trim() || null,
        year: editForm.year ? parseInt(editForm.year) : null,
      });
      if (!error) {
        setProjects(prev => prev.map(p => p.id === editingProjectId ? { ...p, ...editForm, year: editForm.year ? parseInt(editForm.year) : undefined } as Project : p));
        setEditingProjectId(null);
        router.refresh();
      }
    } catch (err) {
      console.error('updateProject failed:', err);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleRemoveImageFromProject = async (projectId: string, itemId: string) => {
    if (!confirm('Remove this image from the project? It will stay in your portfolio.')) return;
    const { error } = await removeImageFromProject(projectId, itemId);
    if (!error) {
      setProjects(prev => prev.map(p => p.id === projectId ? { ...p, items: p.items?.filter(i => i.id !== itemId) } : p));
    }
  };

  const handleSetCover = async (projectId: string, imageUrl: string) => {
    const { error } = await updateProjectCover(projectId, imageUrl);
    if (!error) {
      setProjects(prev => prev.map(p => p.id === projectId ? { ...p, cover_image_url: imageUrl } : p));
    }
  };

  // ── PROJECT IMAGE UPLOAD (new file) ──────────────────────

  const openUploadPicker = (projectId: string) => {
    pendingProjectId.current = projectId;
    projectInputRef.current?.click();
  };

  const handleProjectFiles = async (files: FileList | null) => {
    const projectId = pendingProjectId.current;
    if (!files || !user || !projectId) return;
    setUploadingProjectId(projectId);
    for (const file of Array.from(files).slice(0, 10)) {
      if (file.size > 8 * 1024 * 1024) continue;
      const { imageUrl, error } = await addImageToProject(projectId, user.id, file);
      if (!error && imageUrl) {
        const newItem = { id: `tmp-${Date.now()}-${Math.random()}`, image_url: imageUrl, sort_order: 0 };
        setProjects(prev => prev.map(p =>
          p.id === projectId
            ? { ...p, cover_image_url: p.cover_image_url || imageUrl, items: [...(p.items || []), newItem] }
            : p
        ));
        setPortfolio(prev => [...prev, { ...newItem, id: `tmp-port-${Date.now()}` } as any]);
      }
    }
    setUploadingProjectId(null);
    pendingProjectId.current = null;
  };

  // ── PORTFOLIO PICKER (link existing) ─────────────────────

  const openPortfolioPicker = (projectId: string) => {
    setPickerProjectId(projectId);
    setPickerSelected(new Set());
  };

  const togglePickerItem = (itemId: string) => {
    setPickerSelected(prev => {
      const next = new Set(prev);
      if (next.has(itemId)) next.delete(itemId);
      else next.add(itemId);
      return next;
    });
  };

  const confirmPortfolioLink = async () => {
    if (!pickerProjectId || pickerSelected.size === 0) return;
    setIsLinking(true);
    const toLink = portfolio.filter(p => pickerSelected.has(p.id));
    const { error } = await linkPortfolioItemToProject(
      pickerProjectId,
      toLink.map(p => ({ image_url: p.image_url, title: p.title })),
    );
    if (!error) {
      setProjects(prev => prev.map(p => {
        if (p.id !== pickerProjectId) return p;
        const existingUrls = new Set((p.items || []).map(i => i.image_url));
        const newItems = toLink
          .filter(t => !existingUrls.has(t.image_url))
          .map((t, i) => ({ id: `linked-${t.id}-${i}`, image_url: t.image_url, title: t.title, sort_order: (p.items?.length ?? 0) + i }));
        return {
          ...p,
          cover_image_url: p.cover_image_url || (newItems[0]?.image_url ?? ''),
          items: [...(p.items || []), ...newItems],
        };
      }));
    }
    setIsLinking(false);
    setPickerProjectId(null);
    setPickerSelected(new Set());
  };

  const handleDeleteProject = async (projectId: string) => {
    if (!confirm('Are you sure you want to delete this project? The images will remain in your portfolio.')) return;
    const { error } = await deleteProject(projectId);
    if (!error) setProjects(prev => prev.filter(p => p.id !== projectId));
  };

  if (isAuthLoading) {
    return <div className={styles.container}><div className={styles.loading}>// INITIALISING SECURE SESSION...</div></div>;
  }

  return (
    <div className={styles.container} ref={containerRef}>
      {/* Column 1: Sidebar */}
      <aside className={styles.sidebar}>
        <Link href={`/profile/${user?.username}`} className={styles.backLink}>
          <ArrowLeft size={14} /> Back to Profile
        </Link>
        
        <div className={styles.sidebarMeta}>
          <div className={styles.stepMeta}>// PHASE 01</div>
          <h1 className={styles.title}>MANAGE<br/>WORK</h1>
        </div>

        <nav className={styles.nav}>
          <button
            className={`${styles.navItem} ${section === 'portfolio' ? styles.navItemActive : ''}`}
            onClick={() => { setSection('portfolio'); setEditingProjectId(null); }}
          >
            <div className={styles.navItemDot} />
            <span>Portfolio</span>
            <span className={styles.navCount}>{portfolio.length}</span>
          </button>
          <button
            className={`${styles.navItem} ${section === 'projects' ? styles.navItemActive : ''}`}
            onClick={() => setSection('projects')}
          >
            <div className={styles.navItemDot} />
            <span>Projects</span>
            <span className={styles.navCount}>{projects.length}</span>
          </button>
        </nav>

        <div className={styles.sidebarActions}>
          <p className={styles.helpText}>
            STAND-ALONE IMAGES AND CURATED PROJECTS. PROJECT ITEMS AUTOMATICALLY INDEX INTO YOUR GLOBAL PORTFOLIO GRID.
          </p>
        </div>
      </aside>

      {/* Column 2: Form Area */}
      <section className={styles.formArea} ref={formAreaRef}>
        <div className={styles.contentBox}>
          {/* Portfolio Section */}
          {section === 'portfolio' && (
            <div className={styles.section}>
              <div className={styles.sectionHeader}>
                <div className={styles.sectionNumber}>01</div>
                <div>
                  <h2 className={styles.sectionTitle}>Portfolio</h2>
                  <p className={styles.sectionDesc}>Standalone media entries for your public grid.</p>
                </div>
                <button
                  className="btn btn-primary btn-md"
                  onClick={() => portfolioInputRef.current?.click()}
                  disabled={isUploadingPortfolio}
                >
                  {isUploadingPortfolio ? <Loader size={14} className={styles.spin} /> : <Upload size={14} />}
                  {isUploadingPortfolio ? 'UPLOADING...' : 'UPLOAD IMAGES'}
                </button>
              </div>

              <input
                ref={portfolioInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                style={{ display: 'none' }}
                onChange={e => handlePortfolioFiles(e.target.files)}
              />

              <div
                className={styles.dropZone}
                onDrop={handlePortfolioDrop}
                onDragOver={e => e.preventDefault()}
                onClick={() => portfolioInputRef.current?.click()}
              >
                <Upload size={32} className={styles.dropIcon} />
                <span className={styles.dropText}>Click or Drop to Index Work</span>
                <span className={styles.dropHint}>JPG / PNG / WEBP · MAX 8MB · MAX 10 AT ONCE</span>
              </div>

              {portfolioError && <p className={styles.error}>⚠ {portfolioError}</p>}

              {isLoadingPortfolio ? (
                <div className={styles.loading}>FETCHING ASSETS...</div>
              ) : portfolio.length === 0 ? (
                <div className={styles.emptyState}>
                  <ImageIcon size={48} opacity={0.1} />
                  <p>YOUR PORTFOLIO IS EMPTY</p>
                </div>
              ) : (
                <div className={styles.imageGrid}>
                  {portfolio.map(item => (
                    <div key={item.id} className={styles.imageCard}>
                      <img src={item.image_url} alt={item.title || ''} className={styles.gridImage} />
                      <div className={styles.imageOverlay}>
                        <span className={styles.imageTitle}>{item.title || 'UNTITLED ENTRY'}</span>
                        <button className={styles.deleteBtn} onClick={() => handleDeletePortfolioItem(item.id)} title="Remove">
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Projects Section */}
          {section === 'projects' && (
            <div className={styles.section}>
              <div className={styles.sectionHeader}>
                <div className={styles.sectionNumber}>02</div>
                <div>
                  <h2 className={styles.sectionTitle}>Projects</h2>
                  <p className={styles.sectionDesc}>Curated collections with technical specifications.</p>
                </div>
                {!showNewProjectForm && (
                  <button className="btn btn-primary btn-md" onClick={() => setShowNewProjectForm(true)}>
                    <FilePlus size={16} /> CREATE PROJECT
                  </button>
                )}
              </div>

              <input
                ref={projectInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                style={{ display: 'none' }}
                onChange={e => handleProjectFiles(e.target.files)}
              />

              {/* New project form */}
              <AnimatePresence>
                {showNewProjectForm && (
                  <motion.div 
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.95, opacity: 0 }}
                    className={styles.newProjectCard}
                  >
                    <div className={styles.newProjectHeader}>
                      <span className={styles.newProjectLabel}>NEW PROJECT SPECS</span>
                      <button className={styles.closeBtn} onClick={() => { setShowNewProjectForm(false); setNewProjectForm(EMPTY_PROJECT_FORM); setProjectError(null); }}>
                        <X size={20} />
                      </button>
                    </div>
                    <form onSubmit={handleCreateProject} className={styles.newProjectForm}>
                      <div className={styles.formGrid}>
                        <div className={styles.fieldFull}>
                          <label className={styles.label}>Title *</label>
                          <input
                            className="input"
                            value={newProjectForm.title}
                            onChange={e => setNewProjectForm(f => ({ ...f, title: e.target.value }))}
                            placeholder="E.G. SAADI FRAGRANCE CAMPAIGN"
                            required
                          />
                        </div>
                        <div className={styles.field}>
                          <label className={styles.label}>Discipline</label>
                          <select className="input" value={newProjectForm.discipline} onChange={e => setNewProjectForm(f => ({ ...f, discipline: e.target.value }))}>
                            <option value="">— SELECT —</option>
                            {DISCIPLINE_OPTIONS.map(d => <option key={d} value={d}>{d}</option>)}
                          </select>
                        </div>
                        <div className={styles.field}>
                          <label className={styles.label}>Location</label>
                          <div style={{ position: 'relative' }}>
                            <MapPin size={12} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }} />
                            <input
                              className="input"
                              style={{ paddingLeft: 32 }}
                              value={newProjectForm.location}
                              onChange={e => setNewProjectForm(f => ({ ...f, location: e.target.value }))}
                              placeholder="E.G. KARACHI, PK"
                            />
                          </div>
                        </div>
                        <div className={styles.field}>
                          <label className={styles.label}>Format</label>
                          <input
                            className="input"
                            value={newProjectForm.format}
                            onChange={e => setNewProjectForm(f => ({ ...f, format: e.target.value }))}
                            placeholder="E.G. MEDIUM FORMAT"
                          />
                        </div>
                        <div className={styles.field}>
                          <label className={styles.label}>Year</label>
                          <input
                            className="input"
                            type="number"
                            value={newProjectForm.year}
                            onChange={e => setNewProjectForm(f => ({ ...f, year: e.target.value }))}
                            placeholder={String(new Date().getFullYear())}
                          />
                        </div>
                        <div className={styles.fieldFull}>
                          <label className={styles.label}>Context / Description</label>
                          <textarea
                            className={`input ${styles.textarea}`}
                            value={newProjectForm.description}
                            onChange={e => setNewProjectForm(f => ({ ...f, description: e.target.value }))}
                            placeholder="Brief context — client, brief, creative direction..."
                            rows={3}
                          />
                        </div>
                      </div>
                      {projectError && <p className={styles.error}>⚠ {projectError}</p>}
                      <div className={styles.formActions}>
                        <button type="button" className="btn btn-ghost btn-md" onClick={() => { setShowNewProjectForm(false); setNewProjectForm(EMPTY_PROJECT_FORM); }}>Discard</button>
                        <button type="submit" className="btn btn-primary btn-md" disabled={isCreatingProject || !newProjectForm.title.trim()}>
                          {isCreatingProject ? 'CREATING...' : 'CREATE PROJECT INDEX'}
                        </button>
                      </div>
                    </form>
                  </motion.div>
                )}
              </AnimatePresence>

              {isLoadingProjects ? (
                <div className={styles.loading}>SYNCING PROJECTS...</div>
              ) : projects.length === 0 && !showNewProjectForm ? (
                <div className={styles.emptyState}>
                  <FolderOpen size={48} opacity={0.1} />
                  <p>NO PROJECTS FOUND</p>
                </div>
              ) : (
                <div className={styles.projectList}>
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                  >
                    <SortableContext
                      items={projects.map(p => p.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      {projects.map(project => (
                        <SortableProjectCard
                          key={project.id}
                          project={project}
                          isEditing={editingProjectId === project.id}
                          editForm={editForm}
                          setEditForm={setEditForm}
                          isUpdating={isUpdating}
                          handleUpdateProject={handleUpdateProject}
                          setEditingProjectId={setEditingProjectId}
                          handleDeleteProject={handleDeleteProject}
                          openPortfolioPicker={openPortfolioPicker}
                          openUploadPicker={openUploadPicker}
                          handleSetCover={handleSetCover}
                          handleRemoveImageFromProject={handleRemoveImageFromProject}
                          startEditingProject={startEditingProject}
                        />
                      ))}
                    </SortableContext>
                  </DndContext>
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Column 3: Media Area (Insights / Preview) */}
      <aside className={styles.mediaArea}>
        <div className={styles.formGroup}>
          <label className={styles.label}>// WORKSTATION INSIGHTS</label>
          <div className={styles.infoBox}>
            // TOTAL ASSETS INDEXED: {portfolio.length}<br />
            // ACTIVE PROJECTS: {projects.length}<br />
            // DISCIPLINE COVERAGE: {Array.from(new Set(projects.map(p => p.discipline).filter(Boolean))).length} AREAS
          </div>
          
          <label className={styles.label}>// QUICK TIPS</label>
          <div className={styles.helpText}>
            • PORTFOLIO IMAGES AUTOMATICALLY APPEAR IN YOUR PUBLIC GRID.<br /><br />
            • PROJECTS ALLOW YOU TO GROUP WORK WITH TECHNICAL SPECS AND LOCATION DATA.<br /><br />
            • USE THE 'STAR' ICON ON PROJECT ASSETS TO SET A COVER IMAGE FOR THAT COLLECTION.
          </div>
        </div>

        <div style={{ marginTop: 'auto', borderTop: '1.5px solid var(--border-color)', paddingTop: '20px' }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: '#666', marginBottom: '12px' }}>
            // STATUS: SYNCHRONIZED
          </div>
          <p className={styles.helpText}>
            ALL CHANGES ARE PERSISTED TO YOUR GLOBAL CREATIVE PROFILE IN REAL-TIME.
          </p>
        </div>
      </aside>

      {/* ════ PORTFOLIO PICKER MODAL ════ */}
      <AnimatePresence>
        {pickerProjectId && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={styles.modalBackdrop} 
            onClick={() => setPickerProjectId(null)}
          >
            <motion.div 
              initial={{ y: 50, scale: 0.95 }}
              animate={{ y: 0, scale: 1 }}
              exit={{ y: 50, scale: 0.95 }}
              className={styles.modal} 
              onClick={e => e.stopPropagation()}
            >
              <div className={styles.modalHeader}>
                <div>
                  <h2 className={styles.modalTitle}>Index Works</h2>
                  <p className={styles.sectionDesc}>Select images from your global portfolio to include in this project.</p>
                </div>
                <button className={styles.closeBtn} onClick={() => setPickerProjectId(null)}><X size={24} /></button>
              </div>

              {portfolio.length === 0 ? (
                <div className={styles.emptyState}>
                  <p>NO GLOBAL ASSETS FOUND</p>
                </div>
              ) : (
                <div className={styles.pickerGrid}>
                  {portfolio.map(item => {
                    const selected = pickerSelected.has(item.id);
                    return (
                      <button
                        key={item.id}
                        className={`${styles.pickerItem} ${selected ? styles.pickerItemSelected : ''}`}
                        onClick={() => togglePickerItem(item.id)}
                      >
                        <img src={item.image_url} alt={item.title || ''} className={styles.gridImage} />
                        {selected && (
                          <div className={styles.pickerCheck}>
                            <Check size={14} />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}

              <div className={styles.modalFooter}>
                <span className={styles.navLabel}>
                  {pickerSelected.size} ENTRIES SELECTED
                </span>
                <div style={{ display: 'flex', gap: 12 }}>
                  <button className="btn btn-ghost btn-md" onClick={() => setPickerProjectId(null)}>Discard</button>
                  <button
                    className="btn btn-primary btn-md"
                    disabled={pickerSelected.size === 0 || isLinking}
                    onClick={confirmPortfolioLink}
                  >
                    {isLinking ? 'INDEXING...' : `COMMIT TO PROJECT (${pickerSelected.size})`}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── SORTABLE PROJECT CARD ────────────────────────────────────

interface SortableProjectCardProps {
  project: Project;
  isEditing: boolean;
  editForm: ProjectForm;
  setEditForm: React.Dispatch<React.SetStateAction<ProjectForm>>;
  isUpdating: boolean;
  handleUpdateProject: () => Promise<void>;
  setEditingProjectId: (id: string | null) => void;
  handleDeleteProject: (id: string) => Promise<void>;
  openPortfolioPicker: (id: string) => void;
  openUploadPicker: (id: string) => void;
  handleSetCover: (projectId: string, imageUrl: string) => Promise<void>;
  handleRemoveImageFromProject: (projectId: string, itemId: string) => Promise<void>;
  startEditingProject: (project: Project) => void;
}

function SortableProjectCard({
  project,
  isEditing,
  editForm,
  setEditForm,
  isUpdating,
  handleUpdateProject,
  setEditingProjectId,
  handleDeleteProject,
  openPortfolioPicker,
  openUploadPicker,
  handleSetCover,
  handleRemoveImageFromProject,
  startEditingProject,
}: SortableProjectCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: project.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 1,
    opacity: isDragging ? 0.6 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className={styles.projectCard}>
      {isEditing ? (
        <div className={styles.newProjectForm}>
          <div className={styles.formGrid}>
            <div className={styles.fieldFull}>
              <label className={styles.label}>Title *</label>
              <input
                className="input"
                value={editForm.title}
                onChange={e => setEditForm(f => ({ ...f, title: e.target.value }))}
                required
              />
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Discipline</label>
              <select className="input" value={editForm.discipline} onChange={e => setEditForm(f => ({ ...f, discipline: e.target.value }))}>
                <option value="">— SELECT —</option>
                {DISCIPLINE_OPTIONS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Location</label>
              <input
                className="input"
                value={editForm.location}
                onChange={e => setEditForm(f => ({ ...f, location: e.target.value }))}
              />
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Format</label>
              <input
                className="input"
                value={editForm.format}
                onChange={e => setEditForm(f => ({ ...f, format: e.target.value }))}
              />
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Year</label>
              <input
                className="input"
                type="number"
                value={editForm.year}
                onChange={e => setEditForm(f => ({ ...f, year: e.target.value }))}
              />
            </div>
            <div className={styles.fieldFull}>
              <label className={styles.label}>Description</label>
              <textarea
                className={`input ${styles.textarea}`}
                value={editForm.description}
                onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))}
                rows={2}
              />
            </div>
          </div>

          <div className={styles.formActions} style={{ marginTop: 24, justifyContent: 'space-between', gap: 12 }}>
            <button className={styles.deleteProjectBtn} onClick={() => handleDeleteProject(project.id)}>
              <Trash2 size={16} /> DELETE PROJECT
            </button>
            <div style={{ display: 'flex', gap: 12 }}>
              <button className="btn btn-ghost btn-md" onClick={() => setEditingProjectId(null)} style={{ minWidth: 140 }}>DISCARD</button>
              <button className="btn btn-primary btn-md" onClick={handleUpdateProject} disabled={isUpdating} style={{ minWidth: 140 }}>
                {isUpdating ? 'SAVING...' : 'SAVE SPECS'}
              </button>
            </div>
          </div>

          <div style={{ marginTop: 24, borderTop: '1.5px solid var(--border-color)', paddingTop: 16 }}>
            <label className={styles.label} style={{ marginBottom: 12 }}>PROJECT MEDIA MANAGEMENT</label>
            <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
              <button className="btn btn-secondary btn-sm" onClick={() => openPortfolioPicker(project.id)}>
                <ImageIcon size={14} /> CHOOSE FROM PORTFOLIO
              </button>
              <button className="btn btn-secondary btn-sm" onClick={() => openUploadPicker(project.id)}>
                <Upload size={14} /> UPLOAD
              </button>
            </div>
            <div className={styles.projectImageGrid} style={{ background: 'none', padding: 0 }}>
              {(project.items || []).map(item => {
                const isCover = project.cover_image_url === item.image_url;
                return (
                  <div key={item.id} className={styles.projectImageThumb} style={{ position: 'relative' }}>
                    <img src={item.image_url} alt="" />
                    {isCover ? (
                      <div style={{ position: 'absolute', top: 4, left: 4, background: 'var(--color-yellow)', color: 'var(--color-ink)', padding: '2px 5px', fontSize: 8, fontFamily: 'var(--font-mono)', fontWeight: 900, pointerEvents: 'none' }}>
                        COVER
                      </div>
                    ) : (
                      <button
                        title="Set as cover"
                        style={{ position: 'absolute', top: 4, left: 4, background: 'rgba(0,0,0,0.55)', border: 'none', color: '#fff', cursor: 'pointer', padding: 3, lineHeight: 0, borderRadius: 2 }}
                        onClick={() => handleSetCover(project.id, item.image_url)}
                      >
                        <Star size={10} />
                      </button>
                    )}
                    <button
                      className={styles.deleteBtn}
                      style={{ position: 'absolute', top: 4, right: 4 }}
                      onClick={() => handleRemoveImageFromProject(project.id, item.id)}
                    >
                      <X size={10} />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className={styles.projectCardHeader}>
            <div className={styles.dragHandle} {...attributes} {...listeners}>
              <GripVertical size={20} />
            </div>
            <div className={styles.projectMeta}>
              <h3 className={styles.projectName}>{project.title}</h3>
              <div className={styles.projectTags}>
                {project.discipline && <span className={styles.tag}>{project.discipline}</span>}
                {project.location && <span className={styles.tagLocation}><MapPin size={10} /> {project.location}</span>}
                {project.year && <span className={styles.tagLocation}>· {project.year}</span>}
              </div>
              {project.description && <p className={styles.projectDesc}>{project.description}</p>}
            </div>
            <div className={styles.projectActions}>
              <button className="btn btn-secondary btn-sm" onClick={() => startEditingProject(project)}>
                <Pencil size={14} /> EDIT
              </button>
            </div>
          </div>

          <div className={styles.projectImageGrid}>
            {(project.items || []).map(item => (
              <div key={item.id} className={styles.projectImageThumb}>
                <img src={item.image_url} alt={item.title || ''} />
              </div>
            ))}
            <button className={styles.addImageThumb} onClick={() => startEditingProject(project)}>
              <Plus size={20} />
              <span>ADD ASSET</span>
            </button>
          </div>
        </>
      )}
    </div>
  );
}
