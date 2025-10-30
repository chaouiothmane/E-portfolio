// E-Portfolio template script (updated with sample-images feature)
// - Tab switching
// - Edit mode (toggle contenteditable)
// - Save/Load to localStorage (including images and optional uploaded video as Data URL)
// - Export / Import JSON and HTML snapshot
// - Profile photo, engineering project images gallery, video upload and URL preview
// - Lightbox for viewing images/videos
// - "Add sample images" button appends curated images (URLs) to gallery and saves them

(() => {
  const storageKey = 'eportfolioData_v3';
  const editableSelector = '.editable, .editable-input';
  const elements = {}; // map data-key -> element

  // Helpers
  function q(selector, ctx = document) { return ctx.querySelector(selector) }
  function qa(selector, ctx = document) { return Array.from(ctx.querySelectorAll(selector)) }

  // Collect elements with data-key
  qa('[data-key]').forEach(el => {
    elements[el.dataset.key] = el;
  });

  // Ensure header keys exist
  if (!elements.site_title) elements.site_title = q('#site-title');
  if (!elements.site_subtitle) elements.site_subtitle = q('#site-subtitle');

  // Curated sample images (Unsplash) — assistant selected
  const SAMPLE_IMAGES = [
    // scenic engineering/photo-like images
    'https://images.unsplash.com/photo-1508921912186-1d1a45ebb3c1?w=1200&q=80&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1497215842964-222b430dc094?w=1200&q=80&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=1200&q=80&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1496307042754-b4aa456c4a2d?w=1200&q=80&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1502767089025-6572583495b0?w=1200&q=80&auto=format&fit=crop'
  ];

  // Defaults (English)
  const defaults = {
    site_title: 'My E-Portfolio',
    site_subtitle: 'Engineering student',
    home_title: 'Welcome — Introduction',
    home_intro: `<p>Hello — I'm <strong>Othmane Chaoui Kouraichi</strong>, a Moroccan student currently in ENSEEIHT Toulouse. I am passionate about applied mathematics, machine learning and computer vision. Feel free to discover my e-portfolio.</p>`,
    eng_title: 'Engineering Courses & Projects',
    eng_content: `<p>><strong>TIPE — Face data, PCA &amp; CNNs</strong></p>
<p><strong>TIPE topic (2025):</strong>&nbsp;"How to transform raw facial data into a reduced space (PCA) for efficient transition to classification models, and convert that information into actionable neurological diagnostics?" — I explored PCA, feature distances and application to facial-based diagnostics, and I demonstrated a pipeline from preprocessing to model evaluation.</p><p><br></p><p>Project summary: I modeled convolutional neural networks for facial recognition and investigate dimensionality reduction (PCA) as a preprocessing step to make classification more robust and computationally efficient. I studied distance metrics in the reduced space and evaluated how those features can contribute to neurological diagnostics. The work combines mathematical analysis, implementation in Python, and empirical evaluation on curated datasets.</p>
<p>My role was to design and implementation (data pipeline, PCA, CNN design, training, and evaluation), plus writing the final report and preparing the oral presentation (13–15 minutes).</p><p><br</p>`,
    mob_title: 'Mobility (Study/Exchange)',
    mob_content: `<p>After two intense and rewarding years in a Moroccan prep school, where I immersed myself in a rigorous academic program, I am now continuing my educational journey in France.&nbsp;<br>Now, with France as my new base, my mind is already wandering to the possibilities of European mobility ( Germany , Italy ...)</p>`,
    civic_title: 'Civic Engagement',
    civic_content: `<p>I provide unofficial high-school math tutoring to peers and junior students. Tutoring helps reinforce my own understanding and gives me experience explaining technical concepts clearly.&nbsp;</p><p>I also participated in the 'Climate Fresk' workshop. It's an excellent initiative because raising awareness about environmental issues is crucial. It helps everyone understand the scale of the climate crisis and empowers us to take meaningful action for a more sustainable future.</p>`,
    sports_title: 'Sports & Other Activities',
    sports_content: `<p>I am a member of the <strong>Run7</strong> running club: we train 2–3 times per week and prepare for races together. Running helps clear my mind, manage stress during exam periods and improves concentration for long coding sessions. I also enjoy cinema and cooking in my free time.I also participate in student coding events (e.g., Thales BattleDev) where we collaborate on timed algorithmic challenges.</p>
<p>I have a calm tabby cat named <strong>Neil</strong> who keeps me company.</p>`,
    career_title: 'Career Development',
    career_content: `<p>I am exploring internships and research opportunities in machine learning, computer vision, and software engineering. Short-term goals: secure a summer research internship or an industrial internship related to AI. Long-term: work as an AI engineer or pursue graduate studies in machine learning.</p><p>Also I plan to pursue the modIA option in second year to work toward a double diploma (Digital Sciences &amp; Applied Maths). I aim for a career in computer science and AI research/engineering.</p>`,
    career_cv: '',
    career_linkedin: '',
    profile_image: '', // data URL
    contact_email: 'othmane.chaouikouraichi@etu.inp-n7.fr',
    contact_phone: '+33 7 66 08 49 28'
  };

  // Save all fields (including images & video) to localStorage
  function saveToStorage() {
    const data = {};
    for (const key in elements) {
      const el = elements[key];
      if (!el) continue;
      if (el.matches && el.matches('.editable-input')) {
        data[key] = el.value || '';
      } else {
        data[key] = el.innerHTML || '';
      }
    }
    data.profile_image = getProfileImage() || '';
    data.eng_images = getEngImages() || [];
    data.home_video_file = getHomeVideoFile() || '';
    localStorage.setItem(storageKey, JSON.stringify(data));
    return data;
  }

  // Load from storage or defaults
  function loadFromStorage() {
    const raw = localStorage.getItem(storageKey);
    let data = raw ? JSON.parse(raw) : null;
    if (!data) data = defaults;
    // apply values
    for (const key in elements) {
      const el = elements[key];
      if (!el) continue;
      const value = data[key] !== undefined ? data[key] : (defaults[key] || '');
      if (el.matches && el.matches('.editable-input')) el.value = value;
      else el.innerHTML = value;
    }
    setProfileImage(data.profile_image || defaults.profile_image);
    setEngImages(data.eng_images || defaults.eng_images);
    setHomeVideoFile(data.home_video_file || defaults.home_video_file);
    updateVideoPreview();
    updateSiteHeaderFromFields();
  }

  function resetDefaults() {
    if (confirm('Reset ALL content to defaults? This will overwrite saved content in your browser.')) {
      localStorage.removeItem(storageKey);
      loadFromStorage();
      alert('Content reset to defaults.');
    }
  }

  // Tabs
  function switchTab(name) {
    qa('.tab-panel').forEach(sec => sec.hidden = sec.id !== name);
    qa('.main-nav a').forEach(a => a.classList.toggle('active', a.dataset.tab === name));
  }

  // Edit mode
  let inEditMode = false;
  function setEditMode(on) {
    inEditMode = !!on;
    const editables = qa(editableSelector);
    editables.forEach(el => {
      if (el.matches && el.matches('.editable-input')) el.disabled = !on;
      else {
        el.contentEditable = on;
        el.classList.toggle('editing', on);
      }
    });
    // make contact card fields editable when in edit mode
    const contactEmail = q('#contact-email');
    const contactPhone = q('#contact-phone');
    if (contactEmail) contactEmail.contentEditable = on;
    if (contactPhone) contactPhone.contentEditable = on;

    q('#profile-photo-preview').style.cursor = on ? 'pointer' : 'default';
    document.getElementById('toggle-edit').textContent = on ? 'Exit Edit Mode' : 'Enter Edit Mode';
    document.getElementById('save-all').hidden = !on;
    document.getElementById('cancel-edit').hidden = !on;
  }

  // Header sync
  function updateSiteHeaderFromFields() {
    if (elements.site_title) {
      const t = elements.site_title.innerHTML || defaults.site_title;
      q('#site-title').textContent = stripTags(t);
    }
    if (elements.site_subtitle) {
      const s = elements.site_subtitle.innerHTML || defaults.site_subtitle;
      q('#site-subtitle').textContent = stripTags(s);
    }
  }
  function stripTags(s){ return String(s).replace(/<\/?[^>]+(>|$)/g, '') }

  // VIDEO preview helpers
  function updateVideoPreview() {
    const urlEl = elements.home_video_url;
    const fileData = getHomeVideoFile();
    const urlVal = (urlEl && urlEl.value) || '';
    const container = q('#intro-video-preview');
    const fileContainer = q('#home-video-file-preview');
    if (container) container.innerHTML = '';
    if (fileContainer) fileContainer.innerHTML = '';

    if (urlVal) {
      const embed = embedForVideoURL(urlVal);
      if (embed) container.appendChild(embed);
      else {
        const a = document.createElement('a');
        a.href = urlVal;
        a.textContent = urlVal;
        a.target = '_blank';
        container.appendChild(a);
      }
    }

    if (fileData) {
      const video = document.createElement('video');
      video.controls = true;
      video.src = fileData;
      video.style.maxWidth = '100%';
      fileContainer.appendChild(video);
    }
  }

  function embedForVideoURL(val) {
    let iframeSrc = '';
    if (/youtube\.com|youtu\.be/.test(val)) {
      const idMatch = val.match(/(v=|youtu\.be\/)([A-Za-z0-9_-]{6,})/);
      const id = idMatch ? idMatch[2] : '';
      if (id) iframeSrc = `https://www.youtube.com/embed/${id}`;
    } else if (/vimeo\.com/.test(val)) {
      const idMatch = val.match(/vimeo\.com\/(\d+)/);
      const id = idMatch ? idMatch[1] : '';
      if (id) iframeSrc = `https://player.vimeo.com/video/${id}`;
    }
    if (iframeSrc) {
      const iframe = document.createElement('iframe');
      iframe.src = iframeSrc;
      iframe.width = "560";
      iframe.height = "315";
      iframe.allow = "accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture";
      iframe.allowFullscreen = true;
      iframe.style.maxWidth = '100%';
      return iframe;
    }
    return null;
  }

  // PROFILE image
  function getProfileImage() {
    const img = q('#profile-photo-img');
    return img && img.src && !img.hidden ? img.src : '';
  }
  function setProfileImage(dataUrl) {
    const img = q('#profile-photo-img');
    const placeholder = q('.photo-placeholder');
    if (!img) return;
    if (dataUrl) {
      img.src = dataUrl;
      img.hidden = false;
      if (placeholder) placeholder.style.display = 'none';
    } else {
      img.hidden = true;
      if (placeholder) placeholder.style.display = 'block';
    }
  }
  function openProfileUploadDialog() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = e => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = ev => {
        setProfileImage(ev.target.result);
        saveToStorage();
      };
      reader.readAsDataURL(file);
    };
    input.click();
  }

  // ENGINEERING images: array stored in gallery.dataset.images
  function getEngImages() {
    const el = q('#eng-images-gallery');
    if (!el) return [];
    try {
      return JSON.parse(el.dataset.images || '[]');
    } catch (e) { return [] }
  }
  function setEngImages(arr) {
    const gallery = q('#eng-images-gallery');
    if (!gallery) return;
    gallery.dataset.images = JSON.stringify(arr || []);
    renderEngGallery();
  }
  function renderEngGallery() {
    const gallery = q('#eng-images-gallery');
    gallery.innerHTML = '';
    const images = getEngImages();
    images.forEach((dataUrl, idx) => {
      const wrap = document.createElement('div');
      wrap.className = 'image-thumb';
      const img = document.createElement('img');
      img.src = dataUrl;
      img.alt = `Project image ${idx+1}`;
      wrap.appendChild(img);

      const remove = document.createElement('button');
      remove.className = 'remove-btn';
      remove.title = 'Remove image';
      remove.textContent = '×';
      remove.addEventListener('click', () => {
        removeEngImage(idx);
      });
      wrap.appendChild(remove);

      const view = document.createElement('button');
      view.className = 'view-btn';
      view.textContent = 'View';
      view.addEventListener('click', () => openLightboxImage(dataUrl));
      wrap.appendChild(view);

      // click image opens lightbox
      img.addEventListener('click', () => openLightboxImage(dataUrl));

      gallery.appendChild(wrap);
    });
  }
  function addEngImages(files) {
    if (!files || !files.length) return;
    const readerPromises = Array.from(files).map(f => {
      return new Promise((res, rej) => {
        const r = new FileReader();
        r.onload = e => res(e.target.result);
        r.onerror = e => rej(e);
        r.readAsDataURL(f);
      });
    });
    Promise.all(readerPromises).then(results => {
      const current = getEngImages();
      const merged = current.concat(results);
      setEngImages(merged);
      saveToStorage();
    }).catch(err => {
      console.error('Error reading image files', err);
      alert('Error reading image files.');
    });
  }
  function removeEngImage(index) {
    const arr = getEngImages();
    arr.splice(index,1);
    setEngImages(arr);
    saveToStorage();
  }

  // Add assistant-selected sample images to the gallery (keeps existing)
  function addSampleImages() {
    const current = getEngImages();
    // Avoid duplicates by simple URL check
    const toAdd = SAMPLE_IMAGES.filter(url => !current.includes(url));
    if (toAdd.length === 0) {
      alert('Sample images already added.');
      return;
    }
    const merged = current.concat(toAdd);
    setEngImages(merged);
    saveToStorage();
    alert('Added sample images to gallery.');
  }

  // HOME video file handlers
  function setHomeVideoFile(dataUrl) {
    const container = q('#home-video-file-preview');
    container && (container.dataset.video = dataUrl || '');
  }
  function getHomeVideoFile() {
    const container = q('#home-video-file-preview');
    return (container && container.dataset && container.dataset.video) || '';
  }
  function handleHomeVideoFileUpload(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = e => {
      // store dataURL (warning: may be large)
      setHomeVideoFile(e.target.result);
      updateVideoPreview();
      saveToStorage();
    };
    reader.readAsDataURL(file);
  }

  // LIGHTBOX
  function openLightboxImage(dataUrl) {
    const lb = q('#lightbox');
    const content = q('#lightbox-content');
    content.innerHTML = `<img src="${dataUrl}" alt="Preview">`;
    lb.hidden = false;
  }
  function openLightboxVideo(dataUrl) {
    const lb = q('#lightbox');
    const content = q('#lightbox-content');
    content.innerHTML = `<video controls src="${dataUrl}"></video>`;
    lb.hidden = false;
  }
  function closeLightbox() {
    const lb = q('#lightbox');
    const content = q('#lightbox-content');
    content.innerHTML = '';
    lb.hidden = true;
  }

  // Export / Import JSON & HTML snapshot
  function downloadJSON() {
    const data = saveToStorage();
    const blob = new Blob([JSON.stringify(data, null, 2)], {type:'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'eportfolio-data.json';
    a.click();
    URL.revokeObjectURL(url);
  }

  function importJSONFile(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = e => {
      try {
        const data = JSON.parse(e.target.result);
        for (const key in elements) {
          const el = elements[key];
          if (!el) continue;
          if (el.matches && el.matches('.editable-input')) el.value = data[key] !== undefined ? data[key] : (defaults[key] || '');
          else el.innerHTML = data[key] !== undefined ? data[key] : (defaults[key] || '');
        }
        setProfileImage(data.profile_image || '');
        setEngImages(data.eng_images || []);
        setHomeVideoFile(data.home_video_file || '');
        saveToStorage();
        updateVideoPreview();
        alert('Imported JSON and saved to localStorage.');
      } catch (err) {
        console.error(err);
        alert('Invalid JSON file.');
      }
    };
    reader.readAsText(file);
  }

  function downloadHTMLSnapshot() {
    saveToStorage();
    const title = q('#site-title').textContent || 'E-Portfolio';
    const snapshotStyles = getInlineStyles();
    const html = `
<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escapeHtml(title)}</title>
<style>${snapshotStyles}</style>
</head>
<body>
<main>
${q('#content').innerHTML}
</main>
<footer><small>Exported snapshot</small></footer>
</body>
</html>`;
    const blob = new Blob([html], {type:'text/html'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'eportfolio-snapshot.html';
    a.click();
    URL.revokeObjectURL(url);
  }

  function escapeHtml(s){ return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;') }
  function getInlineStyles(){
    return `body{font-family:Arial,Helvetica,sans-serif;padding:18px;background:#fff;color:#111}main{max-width:900px;margin:0 auto}h2{color:#6c8cff}img,video{max-width:100%}`;
  }

  // Bind events
  function bind() {
    // nav
    qa('.main-nav a').forEach(a => {
      a.addEventListener('click', e => {
        e.preventDefault();
        switchTab(a.dataset.tab);
      });
    });

    // edit toggle
    q('#toggle-edit').addEventListener('click', () => setEditMode(!inEditMode));
    q('#save-all').addEventListener('click', () => {
      // update contact values back to elements mapping before saving
      const emailEl = q('#contact-email');
      const phoneEl = q('#contact-phone');
      if (emailEl && elements.contact_email) {
        if (elements.contact_email.matches && elements.contact_email.matches('.editable-input')) elements.contact_email.value = emailEl.textContent;
        else elements.contact_email.innerHTML = emailEl.textContent;
      }
      if (phoneEl && elements.contact_phone) {
        if (elements.contact_phone.matches && elements.contact_phone.matches('.editable-input')) elements.contact_phone.value = phoneEl.textContent;
        else elements.contact_phone.innerHTML = phoneEl.textContent;
      }

      saveToStorage();
      setEditMode(false);
      updateSiteHeaderFromFields();
      alert('Saved.');
    });
    q('#cancel-edit').addEventListener('click', () => {
      loadFromStorage();
      setEditMode(false);
    });

    // profile photo click
    q('#profile-photo-preview').addEventListener('click', () => {
      if (!inEditMode) return;
      openProfileUploadDialog();
    });

    // eng images input
    const engInput = q('#eng-images-input');
    if (engInput) {
      engInput.addEventListener('change', e => {
        addEngImages(e.target.files);
        e.target.value = '';
      });
    }

    // Add sample images button
    const sampleBtn = q('#add-sample-images');
    if (sampleBtn) sampleBtn.addEventListener('click', addSampleImages);

    // download/import
    q('#download-json').addEventListener('click', downloadJSON);
    q('#upload-json-btn').addEventListener('click', () => q('#upload-json').click());
    q('#upload-json').addEventListener('change', e => {
      const file = e.target.files[0];
      importJSONFile(file);
      e.target.value = '';
    });

    q('#download-html').addEventListener('click', downloadHTMLSnapshot);
    q('#reset-btn').addEventListener('click', resetDefaults);

    // home video URL input
    if (elements.home_video_url) {
      elements.home_video_url.addEventListener('input', updateVideoPreview);
    }
    // home video file upload
    const homeVideoFileInput = q('#home-video-file');
    if (homeVideoFileInput) {
      homeVideoFileInput.addEventListener('change', e => {
        const file = e.target.files[0];
        if (file) handleHomeVideoFileUpload(file);
        e.target.value = '';
      });
    }

    // Lightbox close
    q('#lightbox-close').addEventListener('click', closeLightbox);
    q('#lightbox').addEventListener('click', (e) => {
      if (e.target.id === 'lightbox') closeLightbox();
    });

    // Live header edits -> data-key sync
    const titleEl = q('#site-title');
    const subEl = q('#site-subtitle');
    if (titleEl) titleEl.addEventListener('input', () => {
      if (elements.site_title && elements.site_title !== titleEl) {
        if (elements.site_title.matches && elements.site_title.matches('.editable-input')) elements.site_title.value = titleEl.textContent;
        else elements.site_title.innerHTML = titleEl.textContent;
      }
    });
    if (subEl) subEl.addEventListener('input', () => {
      if (elements.site_subtitle && elements.site_subtitle !== subEl) {
        if (elements.site_subtitle.matches && elements.site_subtitle.matches('.editable-input')) elements.site_subtitle.value = subEl.textContent;
        else elements.site_subtitle.innerHTML = subEl.textContent;
      }
    });
  }

  // Init
  loadFromStorage();
  bind();
  switchTab('home');

})();
