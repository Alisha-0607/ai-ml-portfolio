/**
 * data.js — Single source of truth for Alisha Sawant's portfolio data.
 * Contains personal profile metadata, ID card attributes, career experience,
 * skills taxonomy, and the 9-project catalog with unified schema:
 * slug, eyebrow, title, tagline, description, summary, stack[], highlights[4],
 * links {repo, demo, caseStudy}, cover (image path or null), clip {mp4}, media {type, ...}.
 */

export const profile = {
  // Identity & Contact
  name: 'Alisha Sawant',
  title: 'Machine learning · Computer vision · Full-stack',
  summarySentence: 'I build models and products, from research prototypes to deployed web apps.',
  status: 'Open to AI/ML roles',
  statusLink: 'mailto:alishasawant124@gmail.com',
  email: 'alishasawant124@gmail.com',
  github: 'https://github.com/Alisha-0607',
  githubUser: 'Alisha-0607',

  // Assets
  resumePdf: 'assets/Alisha_Sawant_Resume.pdf',
  portraitPlaceholder: 'assets/alisha-portrait.webp',

  // Hero Focus Badges
  currentFocusRoles: [
    'ML Engineer',
    'Full-Stack Developer',
    'Data Analyst'
  ],

  // ID / Profile Card fields (displayed in hero right column)
  idCard: {
    name: 'Alisha Sawant',
    basedIn: 'Mumbai, India',
    education: 'B.Tech in Computer Science',
    educationYear: '2026',
    focus: 'Machine Learning · Computer Vision · Full-Stack',
    experience: 'Software Intern, BARC (healthcare monitoring web application)',
    status: 'Open to AI/ML roles',
    machineReadableLine: 'CREATIVE TECH'
  },

  // About Section Data
  about: {
    lead: "Applied machine learning and full-stack engineer building intelligent systems, from research models to production apps.",
    bio: [
      "I build end-to-end products across computer vision, multimodal pipelines and full-stack web, from PyTorch, YOLOv8, SAM and diffusion models to React, Next.js and Django REST apps. As a software engineering intern with BARC, I built clinical patient-monitoring workflows under strict security and confidentiality constraints."
    ],
    beyondCode: "Beyond software and model development, you'll find me exploring fashion, dancing, experimenting with aesthetics and finding inspiration in nature, culture, designs and everything in between."
  },

  // Experience Timeline
  experience: [
    {
      period: '2 Month· INTERNSHIP from 25th May,2026 - 25th July,2026',
      role: 'Software Engineering Intern',
      organization: 'Bhabha Atomic Research Centre (BARC)',
      description: 'Engineered a clinical healthcare monitoring web application for brain tumor patient management and longitudinal quality-of-life assessment. Developed interactive interfaces in React.js, implemented secure RESTful backend services using Django REST Framework and Knox token authentication, and architected PostgreSQL relational schemas for confidential medical records.'
    },
    {
      period: '2023 – 2027',
      role: 'Academic & Project Engineering',
      organization: 'Vidyalankar Institute Of Technology, Mumbai',
      degree: 'Bachelor of Technology (B.Tech) in Electronics & Computer Science — Artificial Intelligence / Machine Learning Specialization',
      description: 'Conducted extensive hands-on research and applied engineering across computer vision architectures, sign language translation using MediaPipe and Whisper, and generative interior remodeling with Stable Diffusion XL.'
    }
  ],

  // Skills Taxonomy
  skills: [
    {
      category: 'Machine Learning & Computer Vision',
      items: ['PyTorch', 'YOLOv8', 'SAM (Segment Anything)', 'Stable Diffusion XL', 'LoRA Fine-Tuning', 'OpenCV', 'MediaPipe', 'Whisper', 'Scikit-learn', 'BLIP', 'CLIP']
    },
    {
      category: 'Full-Stack & Systems Architecture',
      items: ['React.js', 'Next.js', 'TypeScript', 'JavaScript (ES6+)', 'Python', 'Django REST Framework', 'FastAPI', 'Node.js', 'HTML5 & CSS3', 'Tailwind CSS']
    },
    {
      category: 'Data Science & Databases',
      items: ['PostgreSQL', 'SQL', 'Pandas', 'NumPy', 'Time-Series Forecasting', 'Matplotlib & Seaborn', 'Data Preprocessing']
    },
    {
      category: 'Developer Tools & Protocols',
      items: ['Git & GitHub', 'REST APIs', 'OAuth 2.0', 'Knox Token Auth', 'Three.js / WebGL', 'Socket Programming', 'TCP/IP', 'Linux / Bash']
    }
  ]
};

export const projects = [
  {
    slug: 'house-muse',
    title: 'House Muse',
    category: 'vision',
    eyebrow: 'VISION · GENERATIVE AI',
    tagline: 'AI-Powered Room Analysis and Neural Style Remodeling Pipeline',
    description: 'An automated interior redesign system that scans room geometries with zero-shot segmentation and photorealistically inpaints architectural styles. Combines custom LoRA fine-tuning on Stable Diffusion XL with spatial constraints to preserve structural boundaries.',
    summary: 'AI-powered room analysis and personalized interior redesign pipeline using YOLOv8, SAM, and SDXL with LoRA.',
    role: 'AI / Full-Stack Engineer',
    stack: [
      'Python',
      'Django REST Framework',
      'YOLOv8',
      'SAM',
      'BLIP',
      'CLIP',
      'Stable Diffusion XL',
      'LoRA',
      'PostgreSQL',
      'OAuth'
    ],
    highlights: [
      'Zero-shot spatial segmentation isolating walls, floors, and furniture geometry using SAM and YOLOv8.',
      'Custom LoRA adapter weights fine-tuned on architectural styles with Stable Diffusion XL for photorealistic inpainting.',
      'Multimodal scene understanding combining BLIP captioning and CLIP aesthetic scoring to guide latent generation.',
      'Production Django REST backend orchestrating asynchronous GPU inference queues with PostgreSQL metadata.'
    ],
    links: {
      repo: 'https://github.com/Alisha-0607/House-Muse-',
      demo: null,
      caseStudy: null
    },
    cover: 'assets/projects/house-muse/cover.webp',
    clip: { mp4: 'assets/projects/house-muse/demo.mp4' },
    media: {
      type: 'compare',
      tabs: [
        {
          id: 'living-room',
          label: 'LIVING ROOM (VICTORIAN)',
          before: 'assets/projects/house-muse/living-before.webp',
          after: 'assets/projects/house-muse/living-after.webp',
          alt: 'Living room before and after Victorian redesign'
        },
        {
          id: 'bedroom',
          label: 'BEDROOM (VICTORIAN)',
          before: 'assets/projects/house-muse/bedroom-before.webp',
          after: 'assets/projects/house-muse/bedroom-after.webp',
          alt: 'Bedroom before and after Victorian redesign'
        }
      ]
    },
    featured: true
  },
  {
    slug: 'ishaara-speak',
    title: 'IshaaraSpeak',
    category: 'nlp',
    eyebrow: 'MULTIMODAL · ACCESSIBILITY',
    tagline: 'Real-Time Speech & Text to 3D Indian Sign Language Synthesis',
    description: 'An assistive speech-to-gesture synthesis application bridging spoken communication barriers for the deaf community. Converts live continuous speech into Indian Sign Language gloss tokens and visualizes them on a 60fps 3D animated avatar.',
    summary: 'Real-time voice-to-sign language translation mapping speech and text to 3D Indian Sign Language animations.',
    role: 'Lead Developer',
    stack: [
      'Next.js',
      'TypeScript',
      'Three.js',
      'MediaPipe',
      'Whisper',
      'Web Speech API',
      'Tailwind CSS'
    ],
    highlights: [
      'Integrated Whisper voice recognition with Web Speech API for low-latency live speech transcription.',
      'Parsed conversational grammar into grammatical ISL gloss tokens with dynamic temporal sequencing.',
      'Engineered 3D skeletal avatar kinematics using Three.js and MediaPipe joint coordinate hierarchies.',
      'Responsive Next.js web application built with TypeScript, delivering smooth 60fps gesture rendering.'
    ],
    links: {
      repo: 'https://github.com/Alisha-0607/Ishaara-Speak',
      demo: null,
      caseStudy: null
    },
    cover: 'assets/projects/ishaara-speak/cover.webp',
    clip: { mp4: 'assets/projects/ishaara-speak/demo.mp4' },
    featured: true
  },
  {
    slug: 'weather-classification',
    title: 'Weather & Cloud Classification',
    category: 'vision',
    eyebrow: 'VISION · DEEP LEARNING',
    tagline: 'Edge-Optimized CNN Benchmarks for Meteorological Scene Inference',
    description: 'A deep learning vision pipeline classifying multi-class sky conditions and cloud formations from edge cameras. Evaluates lightweight CNN backbones for edge deployment with Grad-CAM visual explainability.',
    summary: 'Computer vision framework evaluating MobileNetV2, ResNet18, and custom CNNs for real-time sky and scene analysis.',
    role: 'ML Engineer',
    stack: [
      'Python',
      'PyTorch',
      'MobileNetV2',
      'ResNet18',
      'Custom CNN',
      'FastAPI',
      'OpenCV'
    ],
    highlights: [
      'Benchmarked MobileNetV2, ResNet18, and lightweight custom CNN architectures across 11 weather categories.',
      'Achieved 94.2% top-1 classification accuracy with transfer learning and extensive data augmentation.',
      'Deployed an ultra-low latency REST inference endpoint via FastAPI serving predictions in under 18ms.',
      'Implemented Grad-CAM saliency heatmaps to visually verify cloud density and horizon feature attention.'
    ],
    links: {
      repo: 'https://github.com/Alisha-0607',
      demo: null,
      caseStudy: null
    },
    cover: 'assets/projects/weather-classification/cover.webp',
    clip: { mp4: 'assets/projects/weather-classification/demo.mp4' },
    featured: true
  },
  {
    slug: 'semiconductor-growth-predictor',
    title: 'Semiconductor Growth Predictor',
    category: 'data',
    eyebrow: 'ECONOMETRICS · TIME-SERIES',
    tagline: 'Macroeconomic & Fab Capacity Supply Chain Velocity Modeling',
    description: 'An econometric forecasting framework evaluating supply chain velocity and fabrication investments across India’s semiconductor ecosystem. Leverages multivariate time-series forecasting across policy incentives and capex trajectories.',
    summary: 'Forecasting pipeline analyzing market factors, fab investments, and supply velocity across India\'s semiconductor sector.',
    role: 'Data Analyst / ML Researcher',
    stack: [
      'Python',
      'Pandas',
      'NumPy',
      'Scikit-learn',
      'Time-Series Forecasting',
      'Seaborn'
    ],
    highlights: [
      'Synthesized longitudinal macroeconomic data spanning capital expenditure, policy subsidies, and fab output.',
      'Engineered lag features and rolling volatility indicators capturing global silicon market cyclicality.',
      'Trained autoregressive and gradient-boosted regression pipelines with robust walk-forward validation.',
      'Generated automated scenario-planning visual reports predicting multi-year fab capacity expansion curves.'
    ],
    links: {
      repo: 'https://github.com/Alisha-0607/india-semiconductor-growth-predictor',
      demo: null,
      caseStudy: null
    },
    cover: 'assets/projects/semiconductor-growth-predictor/cover.webp',
    clip: { mp4: 'assets/projects/semiconductor-growth-predictor/demo.mp4' },
    featured: true
  },
  {
    slug: 'corporate-saathi',
    title: 'Corporate Saathi',
    category: 'fullstack',
    eyebrow: 'ENTERPRISE · CSR PLATFORM',
    tagline: 'Employee Volunteering & Corporate Social Responsibility Engine',
    description: 'An enterprise CSR platform that coordinates non-profit volunteering initiatives across distributed corporate workforces. Features automated volunteer hour verification, supervisor approvals, and audit-ready ESG reporting.',
    summary: 'Enterprise CSR platform streamlining corporate initiative scheduling, employee hour tracking, and impact reports.',
    role: 'Backend & Django Developer',
    stack: [
      'Python',
      'Django',
      'SQL',
      'PostgreSQL',
      'HTML5',
      'CSS3',
      'JavaScript'
    ],
    highlights: [
      'Architected relational Django data models managing multi-tenant corporate entities and NGO partners.',
      'Built automated volunteer hour logging with supervisor verification workflows and digital certificates.',
      'Generated compliance-ready ESG and CSR impact reports exportable to PDF and spreadsheet formats.',
      'Secured user authentication and role-based permissions preventing unauthorized employee data access.'
    ],
    links: {
      repo: 'https://github.com/Alisha-0607/Corporate-Saathi',
      demo: null,
      caseStudy: null
    },
    cover: 'assets/projects/corporate-saathi/cover.webp',
    clip: { mp4: 'assets/projects/corporate-saathi/demo.mp4' },
    featured: false
  },
  {
    slug: 'creamy-bliss',
    title: 'Creamy Bliss',
    category: 'fullstack',
    eyebrow: 'E-COMMERCE · FULL-STACK',
    tagline: 'Artisan Confectionery Catalog & Frictionless Ordering Platform',
    description: 'A responsive e-commerce web platform for an artisan dessert parlour featuring dynamic flavor customisation and shopping cart state. Built with pure component modularity and relational order persistence in PostgreSQL.',
    summary: 'Responsive artisan ice cream parlour e-commerce platform with dynamic menu catalog and relational order persistence.',
    role: 'Full-Stack Web Developer',
    stack: [
      'HTML5',
      'CSS3',
      'JavaScript',
      'Node.js',
      'PostgreSQL'
    ],
    highlights: [
      'Developed a vibrant, responsive storefront featuring interactive flavor selection and custom scoop bundles.',
      'Built lightweight client-side shopping cart state management with persistent LocalStorage synchronisation.',
      'Configured Node.js REST API endpoints to process checkout validation and transaction order payloads.',
      'Implemented relational PostgreSQL schemas with inventory deductions upon order confirmation.'
    ],
    links: {
      repo: 'https://github.com/Alisha-0607',
      demo: null,
      caseStudy: null
    },
    cover: 'assets/projects/creamy-bliss/cover.webp',
    clip: { mp4: 'assets/projects/creamy-bliss/demo.mp4' },
    featured: false
  },
  {
    slug: 'net-lab',
    title: 'Net-lab',
    category: 'data',
    eyebrow: 'SYSTEMS · NETWORKING',
    tagline: 'Socket-Level Protocol Simulation & Packet Transmission Inspector',
    description: 'A low-level networking suite simulating client-server socket architectures and packet flow control in Python. Demonstrates sliding-window transmission, packet drop recovery with ARQ, and byte-level Wireshark verification.',
    summary: 'Interactive network protocol simulation suite implementing client-server socket architectures and packet tracing.',
    role: 'Systems & Network Developer',
    stack: [
      'Python',
      'Socket Programming',
      'TCP/IP',
      'Wireshark',
      'Packet Analysis'
    ],
    highlights: [
      'Programmed custom raw socket client-server architectures implementing reliable TCP three-way handshakes.',
      'Built sliding window flow control simulations featuring selective repeat and Go-Back-N packet retransmissions.',
      'Captured and analyzed live network traffic with Wireshark to diagnose latency bottlenecks and dropouts.',
      'Implemented CRC32 and checksum error detection routines verifying packet payload integrity.'
    ],
    links: {
      repo: 'https://github.com/Alisha-0607/Net-lab',
      demo: null,
      caseStudy: null
    },
    cover: 'assets/projects/net-lab/cover.webp',
    clip: { mp4: 'assets/projects/net-lab/demo.mp4' },
    featured: false
  },
  {
    slug: 'health-care',
    title: 'Healthcare Monitoring Web Application for Cancer Patients',
    category: 'fullstack',
    eyebrow: 'CLINICAL · BARC',
    tagline: 'Longitudinal Brain Tumor Patient Monitoring & Quality-of-Life System',
    description: 'A clinical healthcare application developed with Bhabha Atomic Research Centre for neuro-oncology care. Facilitates secure longitudinal tracking of patient quality-of-life survey curves under strict privacy controls.',
    summary: 'Clinical healthcare monitoring web application for brain tumor patient management and quality-of-life assessment.',
    role: 'Software Intern (BARC)',
    stack: [
      'React.js',
      'Django REST Framework',
      'PostgreSQL',
      'Knox Auth',
      'REST APIs',
      'Clinical Data Analytics'
    ],
    highlights: [
      'Engineered secure full-stack platform for BARC oncology researchers.',
      'Designed longitudinal tracking dashboards rendering EORTC QLQ-C30 and BN20 quality-of-life survey curves.',
      'Hardened REST APIs using Django Knox token authentication with strict role-based access control (RBAC).',
      'Structured HIPAA-aligned normalized PostgreSQL schemas guaranteeing patient data confidentiality and audit logs.'
    ],
    links: {
      repo: null, // BARC internal clinical system (confidential)
      demo: null,
      caseStudy: null
    },
    cover: 'assets/projects/health-care/cover.webp',
    featured: true
  },
  {
    slug: 'janmitra',
    title: 'JanMitra',
    category: 'fullstack',
    eyebrow: 'CIVIC TECH · FULL-STACK',
    tagline: 'Geotagged Citizen Grievance Redressal & Smart Municipal Dispatch',
    description: 'A civic technology web platform empowering citizens to report community infrastructure issues with geotagged photography. Features an automated municipal triage engine that dispatches tickets directly to designated department officers.',
    summary: 'Citizen grievance redressal platform featuring geotagged issue logging, automated department dispatch, and tracking.',
    role: 'Full-Stack Developer',
    stack: [
      'React',
      'TypeScript',
      'Vite',
      'Node.js',
      'Firebase',
      'Tailwind CSS'
    ],
    highlights: [
      'Engineered an accessible mobile-first citizen portal with GPS-based geotagging and photo attachments.',
      'Automated department routing using municipal classification heuristics to eliminate dispatch delays.',
      'Implemented real-time status push notifications and SMS updates via Firebase Cloud Messaging.',
      'Designed administrative dashboard with SLA tracking, heatmaps, and resolution time analytics.'
    ],
    links: {
      repo: 'https://github.com/Alisha-0607',
      demo: null,
      caseStudy: null
    },
    cover: 'assets/projects/janmitra/cover-v2.webp',
    featured: false
  }
];

export default { profile, projects };
